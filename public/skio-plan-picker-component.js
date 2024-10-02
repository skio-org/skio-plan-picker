import { LitElement, html, css, unsafeHTML } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js'

/**
 * Skio Universal Plan Picker
 * @docs https://integrate.skio.com/
 *
 * Uses LitJS (<5kb) https://lit.dev/ for reactive web components
 */

export class SkioPlanPicker extends LitElement {
  static properties = {
    key: { type: String },

    product: { type: Object },
    productHandle: { type: String },
    selectedVariant: { type: Object },

    options: { type: Object },

    quantity: { type: Number },
    rules: { type: Array },
    rule: { type: Object },
    cart: { type: Object },

    availableSellingPlanGroups: { state: true },
    selectedSellingPlanGroup: { type: Object },
    selectedSellingPlan: { type: Object },

    disableUrl: { type: Boolean },

    debug: { type: Boolean },
  }

  static styles = [
    css`
      :host {
        width: 100%;
        max-width: 440px;
      }

      .skio-plan-picker {
        display: flex;
        gap: 1rem;
        padding: 0;
        border: 0;
        font-size: 15px;
        color: black;
        width: 100%;
        margin-bottom: 1rem;
        font-family: inherit;
      }

      :host([layout='hidden']) .skio-plan-picker {
        display: none;
      }

      :host([layout='vertical']) .skio-plan-picker {
        flex-direction: column;
      }

      :host([layout='horizontal']) .skio-plan-picker {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .sr-only {
        position: absolute;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
      }

      .group-container {
        display: block;
        position: relative;
        transition: border-color 0.2s ease;
        border: var(--skio-group-border-width, 1px) solid var(--skio-group-border-color, #ccc);
        border-radius: var(--skio-group-border-radius, 0);
        background-color: var(--skio-group-background-color, transparent);
        color: var(--skio-group-text-color, #000);
      }

      .group-container--selected {
        border-color: var(--skio-group-border-selected-color, #333);
        background-color: var(--skio-group-background-selected-color, transparent);
        color: var(--skio-group-text-selected-color, #000);
      }

      .group-container--last {
        order: 1;
      }

      :host([layout='horizontal']) .group-container {
        width: calc(50% - 0.5rem - calc(2 * var(--skio-group-border-width, 1px)));
      }

      .group-input {
        position: absolute;
        opacity: 0;
        width: 0px;
        height: 0px;
      }

      .group-input:focus-visible ~ .group-label {
        outline: 2px #ccc solid;
        outline-offset: 4px;
      }

      .group-label {
        display: flex;
        flex-direction: column;
        padding: 10px;
        cursor: pointer;
      }

      .group-topline {
        display: flex;
        align-items: center;
        width: 100%;

        gap: 8px;
      }

      .group-container--selected .group-topline {
        font-weight: 700;
      }

      :host([layout='horizontal']) .group-topline {
        flex-direction: column;
        text-align: center;
      }

      .skio-radio__container {
        display: flex;
        color: var(--skio-group-border-color, #333);
      }

      .group-container--selected .skio-radio__container {
        color: var(--skio-group-border-selected-color, #333);
      }

      .skio-radio {
        transform-origin: center;
        opacity: 0;
        transform: scale(0);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .group-label:hover .skio-radio {
        opacity: 0.75;
        transform: scale(1);
      }

      .group-container--selected .group-label .skio-radio {
        opacity: 1;
        transform: scale(1);
      }

      .skio-price {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        align-items: center;
        text-align: right;
        gap: 4px;

        line-height: 1;

        margin-left: auto;
        vertical-align: middle;

        font-weight: 500;
      }

      .skio-price s {
        font-size: 13px;

        font-weight: 400;
        opacity: 0.75;
      }

      :host([layout='horizontal']) .skio-price {
        text-align: center;
        margin-right: auto;
      }

      .group-content {
        display: flex;
        flex-direction: column;
        opacity: 1;
        width: auto;
        max-height: 1000px;
        transition: max-height 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .group-content.margin-left {
        margin-left: 25px;
      }

      .group-content p {
        margin: 0.5rem 0 0 0;
        font-size: 13px;
        color: #000;
      }

      :host([layout='horizontal']) .group-content {
        width: 100%;
      }

      /* Hide frequency if not selected */
      .group-container:not(.group-container--selected) .group-content {
        pointer-events: none;
        opacity: 0;
        max-height: 0;
        visibility: hidden;
      }

      :host([layout='horizontal']) .group-container:not(.group-container--selected) + .group-content {
        pointer-events: none;
        opacity: 0;
        max-height: 0;
        visibility: hidden;
      }

      .group-title {
        width: 100%;
        max-width: 80%;
        line-height: 1.5;
      }

      :host([layout='horizontal']) .group-title {
        max-width: 100%;
      }

      .savings {
        color: var(--skio-discount-text-color, #fff);
      }

      .savings.bubble {
        padding: 0px 8px;
        background-color: var(--skio-discount-color, #0fa573);
        border: 1px var(--skio-discount-color, #0fa573) solid;
        border-radius: 4px;
        font-size: 12px;
        color: var(--skio-discount-text-color, #fff);

        white-space: nowrap;
      }

      .selling-plan-dropdown {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        display: flex;
        align-items: center;
        gap: 5px;
        width: 100%;
        margin-top: 5px;
        padding: 8px 30px 8px 10px;
        background-color: #f7f7f7;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px top 50%;
        background-size: 16px;
        border: 1px solid #ccc;
        border-radius: 2px;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .selling-plan-dropdown-label {
        color: #666666;
        font-weight: 500;
      }

      .selling-plan-dropdown--one {
        background-image: none;
        pointer-events: none;
        background: transparent;
      }

      .selling-plan-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--skio-button-plan-selector-width, 20px), 1fr));
        gap: 10px;
        padding: 0.75rem 0;
        border: 0;
        font-size: 13px;
      }

      .selling-plan-buttons input[type='radio'] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .selling-plan-buttons label {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 1px solid #ccc;
        text-align: center;
        padding: 1rem 0.5rem;
      }

      .selling-plan-buttons input[type='radio']:checked + label {
        border-color: #000;
      }

      .selling-plan-buttons input:focus-visible + label {
        outline: 2px #ccc solid;
        outline-offset: 4px;
      }

      .skio-details {
        --text-color: #333;
        --text-color-secondary: #888;

        user-select: none;
        -webkit-user-select: none;
        margin-bottom: 20px;
        order: 3;
        max-width: max-content;
      }

      .skio-details summary::-webkit-details-marker,
      .skio-details summary::marker,
      .skio-details slot {
        color: rgba(0, 0, 0, 0) !important;
      }

      .skio-details summary {
        margin-top: 15px;
      }

      .skio-details summary span {
        font-size: 0.9em;
        display: flex;
        padding: 0.5em 0;
        cursor: pointer;
        align-items: center;
        gap: 10px;
        text-decoration: underline;

        margin-top: -40px;
        color: #000;
      }

      @keyframes fadeInDown {
        0% {
          opacity: 0;
          transform: translateY(-15px);
        }
        100% {
          opacity: 1;
          transform: translateY(0px);
        }
      }
      .skio-details[open] > .skio-details--content {
        animation-name: fadeInDown;
        animation-duration: 0.3s;
      }

      .skio-details--content {
        position: absolute;
        z-index: 1020;
        padding: 1em;
        width: fit-content;
        border-radius: 5px;
        background: white;
        box-shadow: 0 0 5px rgb(23 24 24 / 5%), 0 1px 2px rgb(0 0 0 / 7%);
      }

      .skio-details ul {
        margin: 0;
        padding: 0;
      }

      .skio-details ul li {
        display: flex;
        align-items: flex-start;
        gap: 0.75em;

        margin-bottom: 1em;
      }

      .skio-details .skio-content {
        display: flex;
        flex-direction: column;
      }

      .skio-details .skio-content p {
        font-size: 0.9em;

        margin-top: 0;
        margin-bottom: 0;

        letter-spacing: 0;
        line-height: 1.5;

        color: var(--text-color);
      }

      .skio-details ul li small {
        font-size: 0.7em;
        color: var(--text-color-secondary);
      }

      .skio-details .skio-icon {
        display: flex;

        width: 2.25em;
        height: 2.25em;

        color: var(--text-color);
        background: #f8f8f8;
        border-radius: 100%;

        flex-shrink: 0;
        align-items: center;
        justify-content: center;
      }

      .skio-details .skio-icon svg {
        width: 1.25em;
        height: 1.25em;

        color: inherit;
      }

      .skio-details--footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.9em;
      }

      .skio-details--footer a {
        color: var(--text-color);
      }

      .skio-manage-link {
        text-decoration: underline;
      }

      .powered-by-skio {
        font-size: 0.8em;

        display: flex;
        text-decoration: none;

        align-items: center;
        gap: 3px;
      }

      .setupMode {
        position: relative;
        color: black;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 1rem;
        font-size: 14px;
        border-style: solid;
        border-width: 4px;
        border-image: repeating-linear-gradient(-55deg, #000, #000 20px, #ffb101 20px, #ffb101 40px) 10;
      }

      .setupMode:after {
        content: 'Setup Mode';
        position: absolute;
        top: 0;
        right: 0;
        background-color: black;
        color: white;
        padding: 0.25rem 1rem;
        font-size: 13px;
      }

      .setupMode .detection {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
      }

      .setupMode .detection small {
        grid-column: 1/-1;
      }
    `,
  ]

  constructor() {
    super()

    this.currency = window.Shopify.currency.active || 'USD'
    this.language = window.Shopify.locale || 'en-US'
    this.moneyFormatter = new Intl.NumberFormat(this.language, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    // Start - Debug Variables
    this.debug = window?.Shopify?.designMode
    this.variantChanged = false
    // End - Debug Variables

    this.rules = []
    this.rule = null
    this.quantity = 1
    this.showDetailsHover = false
  }

  async connectedCallback() {
    super.connectedCallback()

    this.log('Mounted')

    if (this.productHandle) {
      this.loading = true
      this.fetchProduct(this.productHandle)
    }

    this.bindFormEvents()
    this.bindCartEvents()

    this.rules = await this.fetchRules()
    await this.getRule()
  }

  // SECTION: Element Templates
  radioTemplate() {
    return html`
      <div class="skio-radio__container">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1"></circle>
          <circle class="skio-radio" cx="12" cy="12" r="7" fill="currentColor"></circle>
        </svg>
      </div>
    `
  }

  sellingPlanDropdown(group) {
    return html`
      <select
        class="selling-plan-dropdown ${this.getAvailableSellingPlans(group).length == 1 ? 'selling-plan-dropdown--one' : ''}"
        @change=${e => {
          this.selectSellingPlan(e.target.value)
        }}
      >
        ${group
          ? this.getAvailableSellingPlans(group).map(
              selling_plan => html` <option ?selected=${group.selected_selling_plan.id === selling_plan.id} value=${selling_plan.id}>${selling_plan.name}</option> `
            )
          : ''}
      </select>
    `
  }

  sellingPlanButtons(group) {
    return html`
      <fieldset class="selling-plan-buttons">
        <legend class="sr-only">Select subscription interval</legend>
        ${group
          ? this.getAvailableSellingPlans(group).map(
              selling_plan => html`
                <input
                  type="radio"
                  name="selling_plan_button"
                  value="${selling_plan}"
                  id="selling_plan_button-${selling_plan.id}"
                  @change="${e => this.selectSellingPlan(selling_plan.id)}"
                  ?checked=${group.selected_selling_plan === selling_plan}
                />

                <label for="selling_plan_button-${selling_plan.id}"> ${selling_plan.name} </label>
              `
            )
          : ''}
      </fieldset>
    `
  }

  invalidIcon() {
    return html`
      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#D22B2B" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `
  }

  validIcon() {
    return html`
      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#0BDA51" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `
  }

  setupMode() {
    return html`
      <div class="setupMode">
        Skio Plan Picker
        <small>This will not appear on the live site.</small>

        <small>Key: ${this.key}</small>

        <div class="detection">${this.product ? this.validIcon() : this.invalidIcon()} Product</div>

        <div class="detection">${this.selectedVariant ? this.validIcon() : this.invalidIcon()} Selected Variant</div>

        <div class="detection">${this.form ? this.validIcon() : this.invalidIcon()} Form</div>

        <div class="detection">${this.variantInput ? this.validIcon() : this.invalidIcon()} Variant Input</div>

        <div class="detection">
          ${this.variantChanged ? this.validIcon() : this.invalidIcon()} Variant Change Detection
          <small>Please attempt to change the selected variant.</small>
        </div>

        <small>If any of these don't pass please troubleshoot using our <a target="_blank" rel="noreferrer" href="https://integrate.skio.com/troubleshooting">troubleshooting guide</a>.</small>
      </div>
    `
  }

  groupContent(group) {
    return html`
      <div class="group-content ${this.options?.layout == 'horizontal' ? '' : this.options?.show_radio_selector && this.options?.dropdownPosition == 'inside' ? 'margin-left' : ''}">
        <span class="selling-plan-dropdown-label">${this.additionalFrequencyLabel()}</span>
        ${this.options?.selector_type == 'dropdown' ? this.sellingPlanDropdown(group) : ''}

        <!-- TODO: Make the label have the border instead of the group -->
        ${this.options?.selector_type == 'button' ? this.sellingPlanButtons(group) : ''} ${this.additionalContentText()}
      </div>
    `
  }

  showDetails() {
    return html`
      <details class="skio-details" @mouseover=${e => this.detailsMouseover()} @mouseleave=${e => this.detailsMouseleave()}>
        <summary>
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="ai ai-ArrowRepeat"
            >
              <path d="M18 2l3 3-3 3" />
              <path d="M6 22l-3-3 3-3" />
              <path d="M21 5H10a7 7 0 0 0-7 7" />
              <path d="M3 19h11a7 7 0 0 0 7-7" />
            </svg>

            How do subscriptions work?
          </span>
        </summary>
        <div class="skio-details--content">
          <ul>
            <li>
              <div class="skio-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div class="skio-content">
                <p>Get exclusive deals</p>
                <small>Subscribe for unique discounts</small>
              </div>
            </li>
            <li>
              <div class="skio-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
              <div class="skio-content">
                <p>Edit your subscription anytime</p>
                <small>Edit products, delivery schedule and more</small>
              </div>
            </li>
            <li>
              <div class="skio-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>

              <div class="skio-content">
                <p>No commitment</p>
                <small>Easy to cancel if it’s not for you</small>
              </div>
            </li>
          </ul>
          <div class="skio-details--footer">
            <a class="skio-manage-link" href="/a/account/login">Manage subscriptions</a>

            <a style="letter-spacing: 0" class="powered-by-skio" href="https://skio.com/?utm_source=eonsincshop.myshopify.com&utm_medium=details_popover" target="_blank" rel="noopener">
              Powered by
              <svg width="24" height="11" viewBox="0 0 24 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.28399 5.78801C4.12399 5.63601 3.93599 5.50801 3.71999 5.40401C3.50399 5.30001 3.27599 5.24801 3.03599 5.24801C2.85199 5.24801 2.67999 5.28401 2.51999 5.35601C2.36799 5.42801 2.29199 5.55201 2.29199 5.72801C2.29199 5.89601 2.37599 6.01601 2.54399 6.08801C2.71999 6.16001 2.99999 6.24001 3.38399 6.32801C3.60799 6.37601 3.83199 6.44401 4.05599 6.53201C4.28799 6.62001 4.49599 6.73601 4.67999 6.88001C4.86399 7.02401 5.01199 7.20001 5.12399 7.40801C5.23599 7.61601 5.29199 7.86401 5.29199 8.15201C5.29199 8.52801 5.21599 8.84801 5.06399 9.11201C4.91199 9.36801 4.71199 9.57601 4.46399 9.73601C4.22399 9.89601 3.95199 10.012 3.64799 10.084C3.34399 10.156 3.03999 10.192 2.73599 10.192C2.24799 10.192 1.76799 10.116 1.29599 9.96401C0.831989 9.80401 0.443989 9.57201 0.131989 9.26801L1.23599 8.10401C1.41199 8.29601 1.62799 8.45601 1.88399 8.58401C2.13999 8.71201 2.41199 8.77601 2.69999 8.77601C2.85999 8.77601 3.01599 8.74001 3.16799 8.66801C3.32799 8.58801 3.40799 8.45201 3.40799 8.26001C3.40799 8.07601 3.31199 7.94001 3.11999 7.85201C2.92799 7.76401 2.62799 7.67201 2.21999 7.57601C2.01199 7.52801 1.80399 7.46401 1.59599 7.38401C1.38799 7.30401 1.19999 7.19601 1.03199 7.06001C0.871989 6.92401 0.739989 6.75601 0.635989 6.55601C0.531989 6.35601 0.479989 6.11601 0.479989 5.83601C0.479989 5.47601 0.555989 5.17201 0.707989 4.92401C0.859989 4.66801 1.05599 4.46001 1.29599 4.30001C1.53599 4.14001 1.79999 4.02401 2.08799 3.95201C2.38399 3.87201 2.67599 3.83201 2.96399 3.83201C3.41199 3.83201 3.84799 3.90401 4.27199 4.04801C4.70399 4.18401 5.06799 4.39201 5.36399 4.67201L4.28399 5.78801Z"
                  fill="black"
                />
                <path d="M12.8481 10H10.4121L8.45615 7.13201H8.42015V10H6.44015V0.928009H8.42015V6.44801H8.45615L10.3641 4.02401H12.7521L10.4481 6.72401L12.8481 10Z" fill="black" />
                <path
                  d="M15.7009 2.11601C15.7009 2.26801 15.6689 2.41201 15.6049 2.54801C15.5489 2.67601 15.4689 2.78801 15.3649 2.88401C15.2689 2.98001 15.1489 3.05601 15.0049 3.11201C14.8689 3.16801 14.7249 3.19601 14.5729 3.19601C14.2529 3.19601 13.9849 3.09201 13.7689 2.88401C13.5529 2.66801 13.4449 2.41201 13.4449 2.11601C13.4449 1.97201 13.4729 1.83601 13.5289 1.70801C13.5849 1.57201 13.6649 1.45601 13.7689 1.36001C13.8729 1.26401 13.9929 1.18801 14.1289 1.13201C14.2649 1.06801 14.4129 1.03601 14.5729 1.03601C14.7249 1.03601 14.8689 1.06401 15.0049 1.12001C15.1489 1.17601 15.2689 1.25201 15.3649 1.34801C15.4689 1.44401 15.5489 1.56001 15.6049 1.69601C15.6689 1.82401 15.7009 1.96401 15.7009 2.11601ZM13.5889 10V4.02401H15.5569V10H13.5889Z"
                  fill="black"
                />
                <path
                  d="M23.4516 6.98801C23.4516 7.47601 23.3636 7.92001 23.1876 8.32001C23.0116 8.71201 22.7716 9.04801 22.4676 9.32801C22.1636 9.60001 21.8116 9.81201 21.4116 9.96401C21.0116 10.116 20.5836 10.192 20.1276 10.192C19.6796 10.192 19.2516 10.116 18.8436 9.96401C18.4436 9.81201 18.0916 9.60001 17.7876 9.32801C17.4916 9.04801 17.2556 8.71201 17.0796 8.32001C16.9036 7.92001 16.8156 7.47601 16.8156 6.98801C16.8156 6.50001 16.9036 6.06001 17.0796 5.66801C17.2556 5.27601 17.4916 4.94401 17.7876 4.67201C18.0916 4.40001 18.4436 4.19201 18.8436 4.04801C19.2516 3.90401 19.6796 3.83201 20.1276 3.83201C20.5836 3.83201 21.0116 3.90401 21.4116 4.04801C21.8116 4.19201 22.1636 4.40001 22.4676 4.67201C22.7716 4.94401 23.0116 5.27601 23.1876 5.66801C23.3636 6.06001 23.4516 6.50001 23.4516 6.98801ZM21.5556 6.98801C21.5556 6.79601 21.5236 6.60801 21.4596 6.42401C21.3956 6.24001 21.3036 6.08001 21.1836 5.94401C21.0636 5.80001 20.9156 5.68401 20.7396 5.59601C20.5636 5.50801 20.3596 5.46401 20.1276 5.46401C19.8956 5.46401 19.6916 5.50801 19.5156 5.59601C19.3396 5.68401 19.1916 5.80001 19.0716 5.94401C18.9596 6.08001 18.8716 6.24001 18.8076 6.42401C18.7516 6.60801 18.7236 6.79601 18.7236 6.98801C18.7236 7.18001 18.7516 7.36801 18.8076 7.55201C18.8716 7.73601 18.9636 7.90401 19.0836 8.05601C19.2036 8.20001 19.3516 8.31601 19.5276 8.40401C19.7036 8.49201 19.9076 8.53601 20.1396 8.53601C20.3716 8.53601 20.5756 8.49201 20.7516 8.40401C20.9276 8.31601 21.0756 8.20001 21.1956 8.05601C21.3156 7.90401 21.4036 7.73601 21.4596 7.55201C21.5236 7.36801 21.5556 7.18001 21.5556 6.98801Z"
                  fill="black"
                />
              </svg>
            </a>
          </div>
        </div>
      </details>
    `
  }

  // !SECTION: Element Templates

  render() {
    if (!this.viable() || this.options?.layout === 'hidden') {
      return this.debug ? this.setupMode() : ''
    }

    if (this.selectedVariant.selling_plan_allocations.length === 0 && !this.options?.show_without_subscription) {
      return this.debug ? this.setupMode() : ''
    }

    return html`
      ${this.debug ? this.setupMode() : null}

      <fieldset class="skio-plan-picker" role="radiogroup" aria-labelledby="skio-plan-picker-legend">
        <legend id="skio-plan-picker-legend" class="${!this.options?.show_legend ? 'sr-only' : ''}">${unsafeHTML(this.options?.legend_content)}</legend>

        ${!this.product.requires_selling_plan
          ? html`
              <div
                class="group-container ${this.selectedSellingPlanGroup == null ? 'group-container--selected' : ''} ${!this.options?.onetime_first ? 'group-container--last' : ''}"
                @click=${() => this.selectSellingPlanGroup(null)}
              >
                <input
                  id="one-time-${this.key}"
                  class="group-input"
                  name="skio-group-${this.key}"
                  type="radio"
                  value="One time purchase"
                  ?checked=${!this.selectedSellingPlanGroup}
                  @change=${() => this.selectSellingPlanGroup(null)}
                />

                <label class="group-label" for="one-time-${this.key}">
                  <div class="group-topline">
                    ${this.options?.layout == 'horizontal' ? '' : this.options?.show_radio_selector ? this.radioTemplate() : ''}

                    <div class="group-title">${this.options?.onetime_title ? this.options?.onetime_title : 'One time purchase'}</div>

                    <div class="skio-price" aria-live="polite">
                      ${this.options?.show_compare_price && this.selectedVariant?.compare_at_price > this.selectedVariant.price
                        ? html`<s aria-hidden="true">${this.money(this.selectedVariant.compare_at_price)}</s>`
                        : ''}
                      ${this.money(this.selectedVariant.price)}
                    </div>
                  </div>
                </label>
              </div>
            `
          : ''}
        ${this.availableSellingPlanGroups?.length
          ? this.availableSellingPlanGroups.map(
              (group, index) => html`
                <div class="group-container ${this.selectedSellingPlanGroup == group ? 'group-container--selected' : ''}">
                  <input
                    id="group-${index}-${this.key}"
                    class="group-input"
                    name="skio-group-${this.key}"
                    type="radio"
                    value="${group.id}"
                    @change=${() => this.selectSellingPlanGroup(group)}
                    ?checked=${this.selectedSellingPlanGroup == group}
                  />

                  <label class="group-label" for="group-${index}-${this.key}">
                    <div class="group-topline">
                      ${this.options?.layout == 'horizontal' ? '' : this.options?.show_radio_selector ? this.radioTemplate() : ''}

                      <div class="group-title">
                        ${group.name !== 'Prepaid' && this.options?.subscription_title
                          ? this.options?.subscription_title
                          : group.name == 'Prepaid' && this.options?.prepaid_title
                          ? this.options?.prepaid_title
                          : group.name}
                        ${this.discountText(group.selected_selling_plan)
                          ? html` <span class="savings ${this.options?.discount_style}"> ${this.discountText(group.selected_selling_plan)} </span> `
                          : html``}
                      </div>

                      <div class="skio-price" aria-live="polite">
                        ${this.options?.show_compare_price &&
                        (this.selectedVariant?.compare_at_price > this.selectedVariant.price || this.selectedVariant.price > this.price(group.selected_selling_plan, false))
                          ? html`<s aria-hidden="true">${this.money(this.selectedVariant.compare_at_price ? this.selectedVariant.compare_at_price : this.selectedVariant.price)}</s>`
                          : ''}
                        ${this.price(group.selected_selling_plan)}
                      </div>
                    </div>

                    ${this.options?.layout == 'vertical' && this.options?.dropdownPosition == 'inside' ? this.groupContent(group) : ''}
                  </label>
                </div>
                ${this.selectedSellingPlanGroup == group ? (this.options?.layout == 'horizontal' || this.options?.dropdownPosition == 'underneath' ? this.groupContent(group) : '') : ''}
              `
            )
          : ''}
        ${this.options?.show_details == true ? this.showDetails() : ''}
      </fieldset>
    `
  }

  async fetchRules() {
    if (sessionStorage.getItem('skio-discount-rules')) {
      return JSON.parse(sessionStorage.getItem('skio-discount-rules'))
    } else {
      const rules = await fetch(`https://api.skio.com/storefront-http/get-rules-by-domain-or-hostname?domain=${window?.Shopify?.shop}`)
        .then(response => response.json())
        .then(response => {
          return response.rules.filter(rule => rule.type !== 'surpriseDelight').sort((a, b) => a.minQuantityToDiscount - b.minQuantityToDiscount)
        })

      sessionStorage.setItem('skio-discount-rules', JSON.stringify(rules))
      return rules
    }
  }

  eligibleItemCount(rule) {
    if (!this.cart?.items) return this.quantity

    let cartItems = Number(
      this.cart?.items.reduce((aggregate, item) => (rule?.productVariantIds.some(gid => gid.includes(item.id) && item.selling_plan_allocation) ? aggregate + item.quantity : aggregate), 0)
    )

    return cartItems + this.quantity
  }

  getRule() {
    let largestMinQuantity = {
      value: -1,
      index: -1,
    }

    this.rules.forEach((rule, index) => {
      if (rule.code && largestMinQuantity.value < rule.minQuantityToDiscount) {
        if (rule.minQuantityToDiscount <= this.eligibleItemCount(rule)) {
          largestMinQuantity.value = rule.minQuantityToDiscount
          largestMinQuantity.index = index
        }
      }
    })

    this.rule = largestMinQuantity.index > -1 ? this.rules[largestMinQuantity.index] : null
  }

  bindCartEvents() {
    document.addEventListener('CartUpdated', event => {
      this.cart = event.detail
    })
  }

  bindFormEvents() {
    this.form = document.querySelector(`#${this.options?.form_id}`) || this.closest('form[action*="/cart/add"]')

    if (!this.form) {
      return
    }

    this.variantInput = this.form.querySelector('[name="id"]')

    if (this.variantInput) {
      this.variantInput.addEventListener('change', e => {
        this.selectedVariant = this.product.variants.find(variant => variant.id == e.target.value)
        this.variantChanged = true
      })
    }
  }

  detailsMouseover() {
    let details = this.renderRoot.querySelector('.skio-details')
    let summary = this.renderRoot.querySelector('.skio-details summary')
    if (!details.hasAttribute('open') && this.showDetailsHover == false) {
      summary.click()
      this.showDetailsHover = true
    }
  }

  detailsMouseleave() {
    let details = this.renderRoot.querySelector('.skio-details')
    let summary = this.renderRoot.querySelector('.skio-details summary')
    if (details.hasAttribute('open') && this.showDetailsHover == true) {
      summary.click()
      this.showDetailsHover = false
    }
  }

  updated(changed) {
    if (!this.viable()) return

    if (changed.has('product') && this.product) {
      this.key = this.key ? this.key : this.product.id
    }

    if (changed.has('selectedVariant') && this.selectedVariant) {
      const filteredSellingPlanGroups = this.product.selling_plan_groups.filter(
        selling_plan_group =>
          selling_plan_group.app_id === 'SKIO' && !selling_plan_group.name.toLowerCase().includes('hidden-') && !selling_plan_group.name.toLowerCase().includes('dynamic box subscription')
      )

      //update availableSellingPlanGroups based on skioSellingPlanGroups and selectedVariant.id
      this.availableSellingPlanGroups = filteredSellingPlanGroups.filter(selling_plan_group =>
        selling_plan_group.selling_plans.some(selling_plan =>
          this.selectedVariant.selling_plan_allocations.some(selling_plan_allocation => selling_plan_allocation.selling_plan_id === selling_plan.id)
        )
      )

      if (this.options?.combine_groups) {
        this.availableSellingPlanGroups = [
          {
            name: this.options?.combined_group_name,
            selling_plans: this.availableSellingPlanGroups.flatMap(group => group.selling_plans),
            id: 'combined_group',
            app_id: 'SKIO',
          },
        ]
      }

      // TODO: Select proper group depending on what selling plan is selected

      //update selectedSellingPlan value
      if (this.availableSellingPlanGroups?.length) {
        const url = new URL(window.location.href)
        const urlSelectedSellingPlanId = url.searchParams.get('selling_plan')

        //update each group with a default selected_selling_plan
        this.availableSellingPlanGroups.forEach(group => {
          const availableSellingPlans = this.getAvailableSellingPlans(group)

          const urlSelectedSellingPlan = availableSellingPlans.find(plan => plan.id == urlSelectedSellingPlanId)
          const nameSelectedSellingPlan = availableSellingPlans.find(plan => plan.name === this.selectedSellingPlan?.name)
          const defaultSellingPlan =
            this.options?.default_subscription && this.options.default_subscription.trim() !== ''
              ? availableSellingPlans.find(plan => plan.name.toLowerCase().includes(this.options.default_subscription.toLowerCase()))
              : null

          group.selected_selling_plan = urlSelectedSellingPlan || nameSelectedSellingPlan || defaultSellingPlan || availableSellingPlans[0]

          const isAnyPlanSelected = urlSelectedSellingPlan || nameSelectedSellingPlan || defaultSellingPlan

          group.selected = !!isAnyPlanSelected
        })

        if ((!this.variantChanged && this.options?.start_onetime == false) || this.product.requires_selling_plan == true || urlSelectedSellingPlanId || this.selectedSellingPlan) {
          let selectedSellingPlanGroup = this.availableSellingPlanGroups.find(group => group.selected) || this.availableSellingPlanGroups[0]
          let selectedSellingPlanId = selectedSellingPlanGroup.selected_selling_plan.id
          this.selectSellingPlan(selectedSellingPlanId)
        } else {
          this.selectSellingPlanGroup(null)
        }
      } else {
        this.selectSellingPlanGroup(null)
      }
    }

    if (changed.has('selectedSellingPlan')) {
      //dispatch CustomEvent to tell that this specific plan picker was updated, and pass the selectedSellingPlan
      const event = new CustomEvent(`skio::update-selling-plan`, {
        bubbles: true,
        composed: true,
        detail: {
          variant: this.selectedVariant,
          sellingPlan: this.selectedSellingPlan,
          key: this.key,
        },
      })

      this.dispatchEvent(event)

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.selectedSellingPlan?.id },
        })
      )
    }

    this.updateForm()
    this.updateExternalPrice()

    if (!this.disableUrl) {
      this.updateURLParams()
    }

    if (changed.has('quantity')) {
      this.getRule()
    }

    if (changed.has('cart')) {
      this.getRule()
    }

    this.updateExternalElements()
  }

  updateExternalElements() {
    document.querySelectorAll(`[skio-price][skio-key="${this.key}"]`).forEach(el => {
      el.innerHTML = this.price(this.selectedSellingPlan)
    })

    document.querySelectorAll(`[skio-subscription-content]`).forEach(el => {
      el.style.display = this.selectedSellingPlan ? 'block' : 'none'
    })
  }

  // SECTION: Utility Functions
  log(...args) {
    args.unshift(`%c[skio plan picker][${this.key}]`, 'color: #8770f2;')
    console.log.apply(console, args)
  }

  error(...args) {
    args.unshift(`%c [skio plan picker][${this.key}]`, 'color: #ff0000')
    console.error.apply(console, args)
  }

  appendOrdinalSuffix(num) {
    const j = num % 10,
      k = num % 100
    if (j == 1 && k != 11) {
      return num + 'st'
    }
    if (j == 2 && k != 12) {
      return num + 'nd'
    }
    if (j == 3 && k != 13) {
      return num + 'rd'
    }
    return num + 'th'
  }

  money(price) {
    return this.moneyFormatter.format(price / 100.0)
  }

  viable() {
    const errors = []

    const sellingPlanInput = this.querySelector('input[name=selling_plan]')
    if (!sellingPlanInput) {
      errors.push('Missing selling plan input')
    }

    if (!this.product) {
      errors.push('No product found. Please pass a product or productHandle to the skio-plan-picker component.')
    }
    if (!this.selectedVariant) {
      errors.push('No variant found. Please pass a product or productHandle to the skio-plan-picker component.')
    }
    if (!this.form) {
      errors.push('No form found. Please add a form_id to the plan picker through the Shopify customizer or ensure that the element is in a form that has an input with name="id".')
    }
    if (!this.variantInput) {
      errors.push('No variant input found. Please add a form_id to the plan picker through the Shopify customizer or ensure that the element is in a form that has an input with name="id"')
    }

    if (errors.length == 0) return true

    this.error('Errors', errors)
    return false
  }

  getAvailableSellingPlans(group) {
    let availableSellingPlans = group.selling_plans.filter(selling_plan =>
      this.selectedVariant.selling_plan_allocations.some(selling_plan_allocation => selling_plan_allocation.selling_plan_id === selling_plan.id)
    )

    return availableSellingPlans
  }

  // !SECTION: Utility Functions

  // Update selected selling plan group; called on click of group-container element
  selectSellingPlanGroup(group) {
    this.selectedSellingPlanGroup = group
    this.selectedSellingPlan = group?.selected_selling_plan
  }

  // Update selected selling plan; called on change of skio-frequency select element
  selectSellingPlan(selling_plan_id) {
    const selectedGroup = this.availableSellingPlanGroups.find(group => group.selling_plans.some(plan => plan.id == selling_plan_id))
    const selectedSellingPlan = selectedGroup.selling_plans.find(plan => plan.id == selling_plan_id)

    selectedGroup.selected_selling_plan = selectedSellingPlan
    this.selectedSellingPlanGroup = selectedGroup
    this.selectedSellingPlan = selectedSellingPlan
  }

  updateExternalPrice() {
    document.querySelectorAll(this.options?.external_price_selector).forEach(el => {
      this.selectedSellingPlan ? (el.innerHTML = this.price(this.selectedSellingPlan)) : (el.innerHTML = this.money(this.selectedVariant.price))
    })
    document.querySelectorAll(this.options?.external_price_selector).forEach(el => {
      this.selectedSellingPlan ? (el.innerHTML = this.price(this.selectedSellingPlan) + ' ' + this.currency) : (el.innerHTML = this.money(this.selectedVariant.price) + ' ' + this.currency)
    })
  }

  additionalFrequencyLabel() {
    if (!this.options?.additional_frequency_label || this.options?.additional_frequency_label == '') return

    return unsafeHTML(this.options?.additional_frequency_label)
  }

  additionalContentText() {
    if (!this.options?.additional_subscription_content || this.options?.additional_subscription_content == '') return

    return unsafeHTML(
      this.options?.additional_subscription_content
        .replaceAll('[discount]', this.options?.discount_format === 'absolute' ? this.money(this.discount(this.selectedSellingPlan).absolute) : this.discount(this.selectedSellingPlan).percent + '%')
        .replaceAll('[future_price_adjustments]', this.postCheckoutDiscountsText(this.selectedSellingPlan) || '')
    )
  }

  // SECTION: Discount Functions
  // Calculates discount based on selling_plan.price_adjustments, returns { percent, amount } of selling plan discount
  discountText(selling_plan) {
    const discount = this.discount(selling_plan)
    const hasInvalidDiscount = Object.values(discount).some(value => value === 0 || value === Infinity || value.toString().includes('-'))

    if (hasInvalidDiscount) {
      return '' // Return empty if any invalid condition is met
    } else {
      return unsafeHTML(
        this.options?.discount_text
          .replaceAll('[discount]', this.options?.discount_format === 'absolute' ? this.money(discount.absolute) : discount.percent + '%')
          .replaceAll('[future_price_adjustments]', this.postCheckoutDiscountsText(selling_plan) || '')
      )
    }
  }

  discount(selling_plan) {
    if (!selling_plan) return { percent: 0, amount: 0 }
    return this.getDiscountFromPriceAdjustment(selling_plan, selling_plan.price_adjustments[0])
  }

  postCheckoutPriceAdjustments(selling_plan) {
    const { price_adjustments } = selling_plan
    const postCheckoutPriceAdjustments = price_adjustments.filter(({ position }) => position !== 1)
    const discounts = postCheckoutPriceAdjustments.map(price_adjustment => this.getDiscountFromPriceAdjustment(selling_plan, price_adjustment))
    return discounts
  }

  postCheckoutDiscountsText(sellingPlan = this.selectedSellingPlan) {
    if (!sellingPlan || !this.options?.future_price_adjustments_text || this.future_price_adjustments_text == '') return

    const postCheckoutPriceAdjustments = this.postCheckoutPriceAdjustments(sellingPlan)
    if (!postCheckoutPriceAdjustments.length) return

    return postCheckoutPriceAdjustments.map((discount, index) =>
      this.options?.future_price_adjustments_text
        .replaceAll('[discount]', this.options?.discount_format === 'absolute' ? this.money(discount.absolute) : discount.percent + '%')
        .replaceAll('[order_count]', index + 1)
        .replaceAll('[order_count_ordinal]', this.appendOrdinalSuffix(index + 1))
    )
  }

  getDiscountFromPriceAdjustment(selling_plan, price_adjustment) {
    const discount = {
      percent: 0,
      amount: 0,
      absolute: 0,
    }

    let multiplier = 1

    let sellingPlanGroup = this.product.selling_plan_groups.find(group => group.selling_plans.some(plan => plan.id == selling_plan.id))

    if (sellingPlanGroup?.name === 'Prepaid') {
      const str = selling_plan.name // replace with your string
      const intervalDate = /\b\d+\s*(days|weeks|months|years)\b/gi
      const intervalDateMatches = str.match(intervalDate)

      if (intervalDateMatches?.length) {
        const intervals = intervalDateMatches[0].match(/\d+/g)
        multiplier = intervals[0] / (intervals[1] || 1)
        multiplier = multiplier > 1 ? multiplier : 1
      }
    }

    const price = this.selectedVariant.price
    const compareAtPrice = this.selectedVariant.compare_at_price && this.selectedVariant.compare_at_price > price ? this.selectedVariant.compare_at_price : price

    switch (price_adjustment.value_type) {
      case 'percentage':
        discount.percent = price_adjustment.value
        discount.absolute = Math.round((price * price_adjustment.value) / 100.0)
        discount.amount = Math.round((price * price_adjustment.value) / 100.0)
        break
      case 'fixed_amount':
        discount.percent = Math.round(((price_adjustment.value * 1.0) / price) * 100.0)
        discount.absolute = price_adjustment.value
        discount.amount = price_adjustment.value
        break
      case 'price':
        discount.percent = Math.round((((compareAtPrice * multiplier - price_adjustment.value) * 1.0) / (compareAtPrice * multiplier)) * 100.0)
        discount.absolute = compareAtPrice * multiplier - price_adjustment.value
        discount.amount = price - price_adjustment.value
        break
    }

    return discount
  }
  // !SECTION: Discount Functions
  price(selling_plan, formatted = true) {
    if (this.rule) {
      return formatted
        ? this.money(this.selectedVariant.price - this.discount(selling_plan).amount - this.selectedVariant.price * (this.rule.discountAmount / 100))
        : this.selectedVariant.price - this.discount(selling_plan).amount - this.selectedVariant.price * (this.rule.discountAmount / 100)
    }

    return formatted ? this.money(this.selectedVariant.price - this.discount(selling_plan).amount) : this.selectedVariant.price - this.discount(selling_plan).amount
  }

  // Updates element data to be registered by forms
  updateForm() {
    let $sellingPlan = this.querySelector('input[name=selling_plan]')

    if ($sellingPlan) {
      $sellingPlan.value = this.selectedSellingPlan ? this.selectedSellingPlan.id : ''
      $sellingPlan.dispatchEvent(new Event('change'))
    }
  }

  // SECTION: Additional Functionality
  updateURLParams() {
    const url = new URL(window.location.href)

    if (this.selectedSellingPlan) {
      url.searchParams.set('selling_plan', this.selectedSellingPlan.id)
      window.history.replaceState({}, '', url.href)
    } else {
      url.searchParams.delete('selling_plan')
      window.history.replaceState({}, '', url.href)
    }
  }

  // Runs a fetch request to add the selectedVariant to the cart with the passed quantity and selectedSellingPlan
  addToCart(quantity) {
    const items = [
      {
        id: this.selectedVariant.id,
        quantity: quantity,
        ...(this.selectedSellingPlan && {
          selling_plan: this.selectedSellingPlan?.id,
        }),
      },
    ]

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
      }),
    })
      .then(response => response.json())
      .then(response => {
        this.log('Added item to cart: ', response)
        //dispatch CustomEvent to tell document that an item was added to cart
        const event = new CustomEvent(`skio::added-to-cart`, {
          bubbles: true,
          composed: true,
          detail: {
            response,
            key: this.key,
          },
        })

        this.dispatchEvent(event)
      })
      .catch(error => {
        this.error(`SKIO ${this.key} error adding item to cart: `, error)
      })
  }

  fetchProduct = handle => {
    return fetch(`/products/${handle}.js`)
      .then(response => response.json())
      .then(product => {
        this.product = product
        this.selectedVariant = product.variants[0]

        return product
      })
  }
  // !SECTION: Additional Functionality
}

if (!customElements.get('skio-plan-picker')) {
  customElements.define('skio-plan-picker', SkioPlanPicker)
}

if (window) window.SkioPlanPicker = SkioPlanPicker
