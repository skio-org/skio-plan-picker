/*
Usage: 
<skio-cart-upsell item='{{ item | json | escape }}' line='{{ forloop.index }}'></skio-cart-upsell>
<script src="{{ 'skio-cart-upsell.js' | asset_url }}" type="module"></script>
May want to include above module globally if element is used in cart drawer
*/

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

const skioCartStyles = css`
  .skio-cart-upsell {
    margin-top: 10px;
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: 1px solid black;
    border-radius: 0.5rem;
    cursor: pointer;
    max-width: 300px;
  }

  .skio-cart-upgrade {
    margin-top: 10px;
    background: #886af6;
    color: white;
    border: 1px solid transparent;
    outline: none;
    cursor: pointer;
    padding: 1rem;
    width: 100%;
    border-radius: 0.5rem;
    transition: color 0.25s, background-color 0.25s, border-color 0.25s;
  }

  .skio-cart-upgrade:hover {
    color: #886af6;
    border-color: #886af6;
    background: transparent;
  }
`;

export class SkioCartUpsell extends LitElement {
  static styles = skioCartStyles;

  static properties = {
    item: { type: Object },
    line: { type: Number },

    product: { type: Object },
    selectedVariant: { type: Object },
    key: { type: String },
    
    skioSellingPlanGroups: {},
    availableSellingPlanGroups: {},

    selectedSellingPlanGroup: {},
    selectedSellingPlan: {},

    discount_format: { type: String },

    moneyFormatter: {},

    currency: { type: String }
  };

  constructor() {
    super();

    this.item = null;
    this.line = null;

    this.product = null;
    this.selectedVariant = null;

    this.skioSellingPlanGroups = null;
    this.availableSellingPlanGroups = null;

    this.selectedSellingPlanGroup = null;
    this.selectedSellingPlan = null;

    this.discountFormat = 'percent';

    this.currency = 'USD';
    this.moneyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });
  }

  upgradeButton = () => {
    if (this.availableSellingPlanGroups?.length > 0) {
      return html`
      <button class="skio-cart-upgrade" type="button" @click=${() => this.selectSellingPlan(this.availableSellingPlanGroups[0].selected_selling_plan.id) }>Upgrade to a Subscription & Save ${ this.discount(this.availableSellingPlanGroups[0].selected_selling_plan).percent }</button>
    `;
    } else {
      return html``;
    }
  }

  changeFrequency = () => {
    return html`
      <select class="skio-cart-upsell" skio-cart-upsell="${ this.key }" @change=${ (e) => this.selectSellingPlan(e.target.value) }>
        ${ !this.product.requires_selling_plan ? 
          html`
          <optgroup label="One Time Purchase">
            <option value="">One-time</option>
          </optgroup>
          `
        : ''}

        ${ this.availableSellingPlanGroups ? this.availableSellingPlanGroups.map((group, index) => 
          html`
            <optgroup label="${ group.name } (Save ${ this.discount(group.selected_selling_plan).percent })">
              ${ group ? group.selling_plans.map((selling_plan) => 
                html`
                <option value="${ selling_plan.id }" .selected=${ selling_plan.id == this.selectedSellingPlan?.id }>
                  ${ selling_plan.name }
                </option>
                `
              ): ''}
            </optgroup>
          `
        ): ''}
      </select>
    `;
  }

  render() {
    if(!this.item || !this.product || !this.selectedVariant) return;
    return this.selectedSellingPlan ? this.changeFrequency() : this.upgradeButton();
  }

  updated = (changed) => {

    if(changed.has('item') && this.item) {
      this.fetchProduct(this.item.handle);
    }

    if(changed.has('product') && this.product) {

      this.skioSellingPlanGroups = this.product.selling_plan_groups.filter(
        selling_plan_group => selling_plan_group.app_id === 'SKIO'
      )

      this.selectedVariant = this.product.variants.find(variant => variant.id == this.item.variant_id);

      if(this.item.selling_plan_allocation) {
        this.selectedSellingPlanGroup = this.skioSellingPlanGroups.find(group => group.selling_plans.find(selling_plan => selling_plan.id == this.item.selling_plan_allocation.selling_plan.id));
        this.selectedSellingPlan = this.selectedSellingPlanGroup.selling_plans.find(selling_plan => selling_plan.id == this.item.selling_plan_allocation.selling_plan.id);
      }

    }

    if(changed.has('selectedVariant') && this.selectedVariant) {
      //update availableSellingPlanGroups based on skioSellingPlanGroups and selectedVariant.id
      this.availableSellingPlanGroups = this.skioSellingPlanGroups.filter(selling_plan_group =>
        selling_plan_group.selling_plans.some(selling_plan =>
          this.selectedVariant.selling_plan_allocations.some(
            selling_plan_allocation => selling_plan_allocation.selling_plan_id === selling_plan.id
          )
        )
      )

      //update selectedSellingPlan value
      if (this.availableSellingPlanGroups.length) {
        //update each group with a default selected_selling_plan
        
        this.availableSellingPlanGroups.forEach((group => {
          group.selected_selling_plan = group.selling_plans[0];
        }));
      }
    }

    if(changed.has('selectedSellingPlan') && this.product) {
      this.updateLineItem();
    }

  }

  log = (...args) => {
    args.unshift('%c[skio cart upsell]', 'color: #8770f2;');
    console.log.apply(console, args);
  }

  error = (...args) =>  {
    args.unshift('%c [skio cart upsell]', 'color: #ff0000');
    console.error.apply(console, args);
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart_form',
        section: document.getElementById('cart_form').dataset.id,
        selector: '.cart__item-list'
      }
    ];
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  updateLineItem() {    
    if(!this.line || !this.item) return;
    if(this.item.selling_plan_allocation?.selling_plan?.id == this.selectedSellingPlan?.id) return;

    let data;

    if (this.selectedSellingPlan) {
      data = JSON.stringify({
        line: this.line,
        quantity: this.item.quantity,
        selling_plan: this.selectedSellingPlan ? this.selectedSellingPlan?.id : null,
        properties: {
          'Subscription Discount': this.discount(this.selectedSellingPlan).percent
        }
      });
    } else {
      data = JSON.stringify({
        line: this.line,
        quantity: this.item.quantity,
        selling_plan: null,
        properties: {
          'Subscription Discount': null
        }
      });
    }

    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data
    })
    .then((response) => response.text())
    .then((cart) => {
          
      if (Shopify.theme.jsCart !== 'undefined' && window.location.href.includes('/cart')) {
        Shopify.theme.jsCart.updateView(JSON.parse(cart), this.line);
      }

      if (typeof Shopify.theme.jsAjaxCart !== 'undefined') {
        Shopify.theme.jsAjaxCart.updateView();
      }
      
      // if (window.location.href.includes('/cart')) {
      //   const parsedState = JSON.parse(cart);
      //   this.getSectionsToRender().forEach((section => {
      //     const elementToReplace =
      //       document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
      //     elementToReplace.innerHTML =
      //       this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
      //   }));
      // }

    })
  }
  
  // Update selected selling plan group; called on click of skio-group-container element
  selectSellingPlanGroup(group) {
    this.selectedSellingPlanGroup = group;
    this.selectedSellingPlan = group?.selected_selling_plan;
  }

  // Update selected selling plan; called on change of skio-frequency select element
  selectSellingPlan(id) {
    if(!id) {
      this.selectedSellingPlanGroup = null;
      this.selectedSellingPlan = null;
      return;
    }

    let group = this.availableSellingPlanGroups.find(group => group.selling_plans.find(selling_plan => selling_plan.id == id));
    let selling_plan = group.selling_plans.find(x => x.id == id);
    
    if (selling_plan) {
      group.selected_selling_plan = selling_plan;
      this.selectedSellingPlanGroup = group;
      this.selectedSellingPlan = selling_plan;
    }
    else this.log("Error: couldn't find selling plan with id " + element.value + " for variant " + this.selectedVariant.id + " from product " + this.product.id + " : " + this.product.handle);
  }

  // Formats integer value into money value
  money(price) {
    return this.moneyFormatter.format(price / 100.0)
  }

  // Calculates discount based on selling_plan.price_adjustments, returns { percent, amount } of selling plan discount
  discount(selling_plan) {
    if (!selling_plan)
      return { percent: '0%', amount: 0 }
    
    const price_adjustment = selling_plan.price_adjustments[0]
    const discount = { percent: '0%', amount: 0 }
    const price = this.selectedVariant.price;
    
    switch (price_adjustment.value_type) {
      case 'percentage':
        discount.percent = `${price_adjustment.value}%`
        discount.amount = Math.round(
          (price * price_adjustment.value) / 100.0
        )
        break
      case 'fixed_amount':
        discount.percent = `${Math.round(
          ((price_adjustment.value * 1.0) / price) * 100.0
        )}%`
        discount.amount = price_adjustment.value
        break
      case 'price':
        discount.percent = `${Math.round(
          (((price - price_adjustment.value) * 1.0) /
            price) *
            100.0
        )}%`
        discount.amount = price - price_adjustment.value
        break
    }
    
    return discount
  }

  fetchProduct = async(handle) => {
    let productCache = window.sessionStorage.skioCartProductCache ? JSON.parse(window.sessionStorage.skioCartProductCache) : [];
    let cachedProduct = productCache ? productCache.find(product => product.handle == handle) : null;
    
    if(cachedProduct) {
      this.product = cachedProduct;
    } else {
      await fetch(`/products/${ handle }.js`)
      .then((response) => response.json())
      .then((response) => {
        this.product = response;
        productCache.push(response);
        window.sessionStorage.skioCartProductCache = JSON.stringify(productCache);
        this.requestUpdate();
      })
    }
  }
}

customElements.define('skio-cart-upsell', SkioCartUpsell);