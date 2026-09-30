/**
 * Shopify Storefront API wrapper
 * Pulls products with images, prices, URLs for email generation.
 */

const API_VERSION = "2024-10";

function storefrontEndpoint() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  return `https://${domain}/api/${API_VERSION}/graphql.json`;
}

function storefrontHeaders() {
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!token) throw new Error("SHOPIFY_STOREFRONT_TOKEN is not set");
  return {
    "content-type": "application/json",
    "X-Shopify-Storefront-Access-Token": token
  };
}

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  url: string;
  tags: string[];
  available: boolean;
};

const QUERY_PRODUCTS = /* GraphQL */ `
  query Products($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          tags
          availableForSale
          onlineStoreUrl
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

export async function listAllProducts(): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let cursor: string | null = null;
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const publicDomain = domain.replace(".myshopify.com", ".com");

  for (let page = 0; page < 20; page++) {
    const res = await fetch(storefrontEndpoint(), {
      method: "POST",
      headers: storefrontHeaders(),
      body: JSON.stringify({ query: QUERY_PRODUCTS, variables: { first: 100, cursor } }),
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`Shopify failed: ${res.status} ${await res.text()}`);
    const json: any = await res.json();
    const data = json?.data?.products;
    if (!data) break;

    for (const edge of data.edges) {
      const n = edge.node;
      all.push({
        id: n.id,
        handle: n.handle,
        title: n.title,
        price: parseFloat(n.priceRange?.minVariantPrice?.amount || "0"),
        currency: n.priceRange?.minVariantPrice?.currencyCode || "EUR",
        imageUrl: n.featuredImage?.url || null,
        url: n.onlineStoreUrl || `https://${publicDomain}/products/${n.handle}`,
        tags: n.tags || [],
        available: n.availableForSale
      });
    }

    if (!data.pageInfo?.hasNextPage) break;
    cursor = data.pageInfo.endCursor;
  }

  return all;
}
