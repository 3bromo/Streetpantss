export function formatPrice(value: number): string {
  return `${value.toLocaleString('en-US')} EGP`
}

export const FREE_SHIPPING_THRESHOLD = 2000
export const STANDARD_SHIPPING = 50
export const EXPRESS_SHIPPING = 120
