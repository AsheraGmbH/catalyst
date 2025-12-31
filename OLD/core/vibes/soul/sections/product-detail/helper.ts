// Convert cart input to GTM add_to_cart format
export function buildAddToCartPayload(data: any)
{
    const physicalItems = data.lineItems.physicalItems;

    const payload = {
        currency: data.currencyCode,
        product_value: physicalItems.reduce((acc: number, item: any) => acc + item.extendedSalePrice.value, 0).toFixed(2),
        line_items: physicalItems.map((item: any) => ({
            product_name: item.name,
            item_id: item.productEntityId.toString(),
            sku: item.variantEntityId.toString(),
            brand_name: item.brand,
            category_name: null,
            purchase_price: (item.extendedSalePrice.value / item.quantity).toFixed(2),
            quantity: item.quantity,
            currency: data.currencyCode,
            discount: '',
        })),
    };

    return payload;
}