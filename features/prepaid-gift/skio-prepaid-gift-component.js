import { LitElement, html, css, unsafeHTML } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js'

/**
 * <skio-prepaid-gift key='{{ block.settings.key }}' options='{{ block.settings | json | escape }}' product='{{ product | json | escape }}'>
 *    <input type='hidden' name='properties[_prepaidGiftMessage]' form='{{ block.settings.form_id }}'>
 *    <input type='hidden' name='properties[_prepaidGiftEmail]' form='{{ block.settings.form_id }}'>
 * </skio-prepaid-gift>
 *
 * <script src='{{ 'skio-prepaid-gift-component.js' | asset_url }}' type='module'></script>
 *
 * Note, make sure there is a change event dispatched when the selling plan input in the form is changed.
 */

export class SkioPrepaidGift extends LitElement {
  static properties = {
    options: { type: Object },
    product: { type: Object },
    isPrepaidSelected: { type: Boolean },
    isPrepaidGift: { type: Boolean },

    debug: { type: Boolean },
    prepaidSelectedChange: { state: true },

    form: { state: true },
    email: { state: true },
    message: { state: true },
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .gift-prepaid {
      display: flex;
      flex-direction: column;
    }

    .prepaid-topline {
      display: flex;
      gap: 10px;
      align-items: center;

      color: #333;
      font-size: 16px;
      letter-spacing: 0;
    }

    .prepaid-topline label {
      cursor: pointer;
    }

    .gift-prepaid-content {
      transition:
        max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      max-height: 0;
      opacity: 0;

      display: flex;
      flex-direction: column;
    }

    .prepaid-input {
      position: relative;
      margin-top: 1.5rem;
    }

    .prepaid-input label {
      font-family:
        Protrakt,
        Open Sans,
        arial,
        sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.8px;
      padding: 0 5px;
      text-transform: uppercase;
      position: absolute;
      top: -0.8rem;
      background: white;
      left: 0.5rem;
      white-space: nowrap;
      width: auto;
    }

    .prepaid-input textarea,
    .prepaid-input input {
      padding: 14px 30px 14px 10px;
      width: 100%;

      font-family: inherit;
      letter-spacing: inherit;
      box-sizing: border-box;
    }

    .prepaid-input textarea:focus,
    .prepaid-input input:focus {
      border-color: #111;
    }

    .gift-prepaid-content.open {
      max-height: 300px;
      opacity: 1;
    }

    /* The switch - the box around the slider */
    .prepaid-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }

    /* The slider */
    .prepaid-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: 0.2s;
      transition: 0.2s;
      border-radius: 34px;
    }

    .prepaid-slider:before {
      position: absolute;
      content: '';
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      -webkit-transition: 0.2s;
      transition: 0.2s;
      border-radius: 50%;
    }

    .prepaid-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .prepaid-switch input:checked + .prepaid-slider {
      background-color: #111;
    }

    .prepaid-switch input:focus + .prepaid-slider {
      box-shadow: 0 0 1px #111;
    }

    .prepaid-switch input:checked + .prepaid-slider:before {
      -webkit-transform: translateX(16px);
      -ms-transform: translateX(16px);
      transform: translateX(16px);
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
  `

  constructor() {
    super()

    this.isPrepaidSelected = false
    this.isPrepaidGift = false

    this.form_id = ''
    this.product = {}
    this.form = null
    this.email = ''
    this.message = ''

    this.sellingPlanInput = null

    this.debug = window?.Shopify?.designMode
  }

  connectedCallback() {
    super.connectedCallback()
  }

  updated = changed => {
    if (changed.has('isPrepaidSelected') && this.isPrepaidSelected) {
      this.prepaidSelectedChange = true
    }

    if (changed.has('options')) {
      if (this.options.form_id) {
        this.form = document.querySelector(`#${this.options.form_id}`) || this.closest('form[action*="/cart/add"]')

        if (this.form) {
          this.sellingPlanInput = document.querySelector(`[name="selling_plan"][form="${this.options.form_id}"]`)

          if (this.sellingPlanInput) {
            this.isPrepaidSelected = this.isPrepaidSellingPlan(this.sellingPlanInput.value)

            this.sellingPlanInput.addEventListener('change', e => {
              this.isPrepaidSelected = this.isPrepaidSellingPlan(e.target.value)
            })
          }
        }
      }
    }

    this.updateForm()
  }

  updateForm() {
    const $email = this.querySelector('input[name="properties[_prepaidGiftEmail]"]')
    const $message = this.querySelector('input[name="properties[_prepaidGiftMessage]"]')

    if (!$email || !$message) return

    $email.value = this.email
    $message.value = this.message

    $email.disabled = !this.isPrepaidGift || !this.isPrepaidSelected
    $message.disabled = !this.isPrepaidGift || !this.isPrepaidSelected
  }

  isPrepaidSellingPlan(sellingPlanId) {
    const selectedGroup = this.product.selling_plan_groups.find(group => {
      return group.selling_plans.find(plan => plan.id == sellingPlanId)
    })

    if (!selectedGroup) return false

    return selectedGroup.name.toLowerCase().includes('prepaid')
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
        Skio Prepaid Gift
        <small>This will not appear on the live site.</small>

        <div class="detection">${this.form ? this.validIcon() : this.invalidIcon()} Form</div>

        <div class="detection">${this.sellingPlanInput ? this.validIcon() : this.invalidIcon()} Selling Plan Input</div>

        <div class="detection">${this.prepaidSelectedChange ? this.validIcon() : this.invalidIcon()} Prepaid Change Detection</div>
        <small>Please attempt to select a prepaid selling plan.</small>

        <small>If any of these don't pass please troubleshoot using our <a target="_blank" rel="noreferrer" href="https://integrate.skio.com/troubleshooting">troubleshooting guide</a>.</small>
      </div>
    `
  }

  render() {
    return html`
      ${this.debug ? this.setupMode() : null}
      ${this.isPrepaidSelected
        ? html`
            <div class="gift-prepaid">
              <div class="prepaid-topline">
                <label class="prepaid-switch">
                  <input id="prepaid-toggle" type="checkbox" name="is-prepaid-gift" .checked="${this.isPrepaidGift}" @change="${e => (this.isPrepaidGift = !this.isPrepaidGift)}" />
                  <span class="prepaid-slider round"></span>
                </label>

                <label for="prepaid-toggle">${this.options?.title ? unsafeHTML(this.options.title) : ''}</label>
              </div>

              <div class="gift-prepaid-content ${this.isPrepaidGift ? 'open' : ''}">
                <div class="prepaid-input">
                  <label for="prepaidGiftEmail">${this.options?.title ? unsafeHTML(this.options.recipient_title) : ''}</label>
                  <input type="email" placeholder="recipient@email.com" value="${this.email}" @input="${e => (this.email = e.target.value)}" />
                </div>

                <div class="prepaid-input">
                  <label for="prepaidGiftMessage">${this.options?.title ? unsafeHTML(this.options.message_title) : ''}</label>
                  <textarea placeholder="Enter your gift message" @input="${e => (this.message = e.target.value)}">${this.message}</textarea>
                </div>

                ${this.options?.additional_content ? unsafeHTML(this.options.additional_content) : ''}
              </div>
            </div>
          `
        : ''}
    `
  }
}

customElements.define('skio-prepaid-gift', SkioPrepaidGift)
