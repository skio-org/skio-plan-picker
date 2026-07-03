/*
Usage: 
  <skio-cart-upsell item='{{ item | json | escape }}' line='{{ forloop.index }}'></skio-cart-upsell>
  <script src="{{ 'skio-cart-upsell.js' | asset_url }}" type="module"></script>
*/

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js'

const skioCartStyles = css`
  .skio-cart-upsell {
    margin-top: 10px;
    width: 100%;
    padding: 7px 5px;
    background: transparent;
    border: 1px solid #C9DBDB;
    border-radius: 5px;
    cursor: pointer;
    max-width: 300px;
    color: #134048;
  }

  .skio-cart-upgrade {
    margin-top: 10px;
    background: #0e1d30; 
    color: #ffffff;
    border: 1px solid #C9DBDB;
    outline: none;
    cursor: pointer;
    padding: 7px 5px;
    width: 100%;
    border-radius: 5px;
    transition: color 0.25s, background-color 0.25s, border-color 0.25s;
  }

  .skio-cart-upgrade:hover {
    color: #000;
    border-color: #000; 
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

    skioSellingPlanGroups: {},
    availableSellingPlanGroups: {},

    selectedSellingPlanGroup: {},
    selectedSellingPlan: {},

    moneyFormatter: {},
    currency: { type: String }
  };

  constructor() {
    super();

    this.item = null;
    this.line = null;

    this.product = null;
    this.selectedVariant = null;

    this.skioSellingPlanGroups = [];
    this.availableSellingPlanGroups = [];

    this.selectedSellingPlanGroup = null;
    this.selectedSellingPlan = null;

    this.currency = 'USD';

    this.moneyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });
  }

  render() {
    if (!this.item || !this.product || !this.selectedVariant) return;

    return this.selectedSellingPlan
      ? this.changeFrequency()
      : this.upgradeButton();
  }

  upgradeButton = () => {
    if (!this.availableSellingPlanGroups.length) return html``;

    return html`
      <button
        class="skio-cart-upgrade"
        type="button"
        @click=${() =>
          this.selectSellingPlan(
            this.availableSellingPlanGroups[0].selling_plans[0].id
          )
        }>
        Upgrade to subscription
      </button>
    `;
  };

  changeFrequency = () => {
    return html`
      <select
        class="skio-cart-upsell"
        @change=${(e) => this.selectSellingPlan(e.target.value)}>

        ${!this.product.requires_selling_plan ? html`
          <optgroup label="One Time Purchase">
            <option value="">One-time</option>
          </optgroup>
        ` : ''}

        ${this.availableSellingPlanGroups.map(group => html`
          <optgroup label="${group.name} Purchase">
            ${group.selling_plans.map(plan => html`
              <option
                value="${plan.id}"
                .selected=${plan.id == this.selectedSellingPlan?.id}>
                ${plan.name}
              </option>
            `)}
          </optgroup>
        `)}
      </select>
    `;
  };

  updated(changed) {

    if (changed.has('item') && this.item) {
      this.fetchProduct(this.item.handle);
    }

    if (changed.has('product') && this.product) {

      this.skioSellingPlanGroups =
        (this.product.selling_plan_groups || []).filter(
          group => group.app_id === 'SKIO'
        );

      this.selectedVariant =
        (this.product.variants || []).find(
          variant => variant.id == this.item.variant_id
        );

      if (this.item.selling_plan_allocation) {
        const id = this.item.selling_plan_allocation.selling_plan.id;

        this.selectedSellingPlanGroup =
          this.skioSellingPlanGroups.find(group =>
            group.selling_plans.some(plan => plan.id == id)
          );

        this.selectedSellingPlan =
          this.selectedSellingPlanGroup?.selling_plans.find(
            plan => plan.id == id
          );
      }
    }

    if (changed.has('selectedVariant') && this.selectedVariant) {

      const allocations =
        this.selectedVariant.selling_plan_allocations || [];

      // this.log('Variant Allocations:', allocations);

      this.availableSellingPlanGroups =
        this.skioSellingPlanGroups
          .map(group => {

            const mappedPlans =
              group.selling_plans.filter(plan =>
                allocations.some(a =>
                  Number(a.selling_plan_id) === Number(plan.id)
                )
              );

            if (!mappedPlans.length) return null;

            return {
              ...group,
              selling_plans: mappedPlans,
              selected_selling_plan: mappedPlans[0]
            };
          })
          .filter(Boolean);

      // this.log('Filtered Groups:', this.availableSellingPlanGroups);
    }

    if (changed.has('selectedSellingPlan') && this.product) {
      this.updateLineItem();
    }
  }

  updateLineItem() {
    if (!this.item) return;

    if (
      this.item.selling_plan_allocation?.selling_plan?.id ==
      this.selectedSellingPlan?.id
    ) return;

    const body = JSON.stringify({
      line: this.line,
      quantity: this.item.quantity,
      selling_plan: this.selectedSellingPlan
        ? this.selectedSellingPlan.id
        : null,

      sections: this.getSectionsToRender().map(s => s.section),
      sections_url: window.location.pathname
    });

    fetch(routes.cart_change_url, {
      ...fetchConfig(),
      body
    })
      .then(res => res.text())
      .then(state => {
        const parsedState = JSON.parse(state);

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'selling-plan-change',
          cartData: parsedState,
          variantId: this.item.variant_id
        });
      })
      .catch(console.error);
  }

  selectSellingPlan(id) {

    if (!id) {
      this.selectedSellingPlanGroup = null;
      this.selectedSellingPlan = null;
      return;
    }

    const group =
      this.availableSellingPlanGroups.find(group =>
        group.selling_plans.some(plan => plan.id == id)
      );

    const selling_plan =
      group?.selling_plans.find(plan => plan.id == id);

    if (selling_plan) {
      this.selectedSellingPlanGroup = group;
      this.selectedSellingPlan = selling_plan;
    }
    else {
      this.error('Could not find selling plan:', id);
    }
  }

  money(price) {
    return this.moneyFormatter.format(price / 100.0);
  }

  getSectionsToRender() {
    return [
      { section: 'cart-drawer' },
      { section: 'cart-icon-bubble' },
      { section: 'cart-live-region-text' }
    ];
  }

  fetchProduct = async(handle) => {

    let productCache =
      window.sessionStorage.skioCartProductCache
        ? JSON.parse(window.sessionStorage.skioCartProductCache)
        : [];

    let cachedProduct =
      productCache.find(product => product.handle == handle);

    if (cachedProduct) {
      this.product = cachedProduct;
      return;
    }

    await fetch(`/products/${handle}.js`)
      .then(res => res.json())
      .then(response => {

        this.product = response;

        productCache.push(response);

        window.sessionStorage.skioCartProductCache =
          JSON.stringify(productCache);

        this.requestUpdate();
      });
  };

  log(...args) {
    args.unshift('%c[skio cart upsell]', 'color: #8770f2;');
    console.log(...args);
  }

  error(...args) {
    args.unshift('%c[skio cart upsell]', 'color: red;');
    console.error(...args);
  }
}

customElements.define('skio-cart-upsell', SkioCartUpsell);
  