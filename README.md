
# Skio Plan Picker

This repository contains the source files needed to integrate Skio into Shopify themes.

## Goal
The component is responsible for adding to cart with the currently selected purchase option. When subscription option is selected, the active selling plan (frequency) ID should be set as the value of `[name="selling_plan"]` input within the product form which will then be passed to the [Cart API](https://shopify.dev/docs/api/ajax/reference/cart#add-a-selling-plan) payload.

## Tech Stack

- [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [lit](https://lit.dev/)
- [Liquid](https://shopify.dev/docs/api/liquid)


## Contents

### Block

| File | Theme destination |
| :-------- | :------- |
| `skio-app-block.liquid` | `snippets` |

Renders the plan picker. Any Skio-specific business logic should stay here.

#### Usage:
```html
{% when 'skio-plan-picker' %}
    {% render 'skio-app-block', block: block, product: product %}
```

### JS Module

| File | Theme destination |
| :-------- | :------- |
| `skio-plan-picker-component.js` | `assets` |

The web component powered by lit that handles the UI and state of the currently selected purchase option (one-time vs subscription). Accepts parameters defined in the block schema.


#### Usage:
```liquid
<{{ block.settings.element_name }}
    key='{{ block.id }}'
    options='{{ block.settings | json | escape }}'
    layout='{{ block.settings.layout }}'

    {% if block.settings.product_handle != null %}
      productHandle='{{ block.settings.product_handle }}'
    {% else %}
      product='{{ product | json | escape }}'
      selectedVariant='{{ product.selected_or_first_available_variant | json | escape }}'
    {% endif %}
  >
    <input type='hidden' name='selling_plan' form='{{ block.settings.form_id }}'>
</{{ block.settings.element_name }}>

<script src='{{ 'skio-plan-picker-component.js' | asset_url }}' type='module'></script>
```
#### Caveats:
- Passing the `options.form_id` is crucial for the component to identify and correctly handle the current state of the product form.
- Key action of the plan picker is to handle the change of selected variant within the product form. In the `bindFormEvents` method, the component looks for the element matching the selector `[name="id"]` in the form and listens to it's `change` event. Some themes may have a different way of handling/triggering a variant change event. In such cases, the method should be adjusted to track the event.

### Section Schema

| File | Theme destination |
| :-------- | :------- |
| `skio-section_schema.json` | `product.liquid blocks schema` |

Contains the configuration settings of the plan picker for Shopify's Theme Editor. The JSON should be pasted into the blocks array of the desired section where the plan picker has to be rendered. Usually after the `@app` element in the `blocks` array.

### Extras

***Cart Upsell Component***

| File | Theme destination | Notes |
| :-------- | :------- | :------- |
| `skio-cart-upsell.js` | `assets` | Within the `cart.items` loop | 

Renders a component that allows to change from subscription to one-time purchase and vice-versa.

## Feedback

If you have any feedback, please reach out to us at migrations@skio.com

