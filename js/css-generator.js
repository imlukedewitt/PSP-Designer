function generateCSS() {
  const config = {
    setAccentColor: document.getElementById('set-accent-color').checked,
    accentColor: document.getElementById('accent-color').value,
    hoverColor: document.getElementById('hover-color').value,
    setBackgroundColor: document.getElementById('set-background-color').checked,
    backgroundColor: document.getElementById('background-color').value,
    darkMode: document.getElementById('dark-mode').checked,
    pageStyle: document.getElementById('page-style').value,
    addMenu: $('#product-menu-container').children().length > 0
  };

  const isDefaultConfig = !config.setAccentColor &&
    !config.addMenu &&
    !config.setBackgroundColor &&
    !config.darkMode &&
    config.pageStyle === 'default';

  if (isDefaultConfig) {
    document.getElementById('generated-css').textContent = '\n\n';
    return;
  }

  let generatedCSS = `
    ${generateAccentColorCSS(config)}
    ${generateThemeCSS(config)}
    ${generateMenuCSS(config)}
  `;
  generatedCSS = prettifyGeneratedCSS(generatedCSS);
  document.getElementById('generated-css').textContent = generatedCSS;
}

function generateAccentColorCSS(config) {
  if (!config.setAccentColor) return '';

  const accentColor = config.accentColor;
  const hoverColor = config.hoverColor;

  return `
    /* Style for primary buttons */
    #subscription_submit, #form__section-apply-components, .form__button--primary, .btn-success {
      border: solid 2px ${accentColor};
      background-color: ${accentColor};
      color: #FFF;
    }
    /* Hover and active states for primary buttons */
    #form__section-apply-components:hover, #subscription_submit:hover, .form__button--is-submitting, .form__button--primary:hover, .form__button--primary:active, .form__button--primary:focus, .form__button--primary:disabled, .btn-success:hover {
      background-color: ${hoverColor};
      border: solid 2px ${hoverColor};
      color: #FFF;
      background-image: none;
    }
    /* Style for summary total text */
    .plan__summary-total {
      color: ${accentColor};
    }
    /* Style for mobile content heading total */
    .content__heading--mobile .content__heading-section--total {
      color: #ffffff;
    }
  `;
}

function generateThemeCSS(config) {
  if (config.pageStyle === 'default' && !config.darkMode && !config.setBackgroundColor) return '';

  let backgroundColor;
  if (config.setBackgroundColor) {
    backgroundColor = config.backgroundColor;
  } else if (config.pageStyle === 'minimal') {
    backgroundColor = config.darkMode ? '#242424' : '#ffffff';
  } else {
    backgroundColor = '#1e2125';
  }

  const textColor = config.darkMode ? '#f9f9f9' : '#000000';
  const borderColor = config.darkMode ? '#ffffff30' : '#00000030';

  switch (config.pageStyle) {
    case 'minimal':
      return `
        /* Minimal page style */
        body {
          background-color: ${backgroundColor};
          color: ${textColor};
          font-size: 16px;
          padding: 0px 15px;
        }
        .content,
        .content__main,
        .content__secondary {
          background: ${backgroundColor};
          border: 0px;
        }
        .content__main {
          border-right: 1px solid ${borderColor} !important;
        }
        .content__headings {
          border: 0px solid #000;
        }
        .content__heading,
        .form__section-heading {
          background: ${backgroundColor};
          color: ${textColor};
          border-bottom: 1px solid ${borderColor};
          padding: 20px;
        }
        .content__heading--mobile {
          background: ${backgroundColor};
          border: 1px solid ${borderColor};
        }
        .form__section--boxed {
          border: 0px solid ${borderColor};
          border-radius: 4px;
        }
        .form__field--boxed,
        .form__field-custom-field {
          border: 1px solid ${borderColor};
        }
        .form__section--boxed header {
          background: ${backgroundColor};
          border-bottom: 1px solid ${borderColor};
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          margin: 0;
          padding: 10px;
        }
        .form__section--billing-address .form__field-radio-group .radio > .form__fields {
          margin: 10px 0px;
        }
        .form__section--billing-address .form__field-radio-group .radio > .form__field {
          margin: 20px 10px 0px 10px;
        }
        .form__field-radio-group {
          border: 1px solid ${borderColor};
        }
        .form__field-radio-group .radio header {
          background: ${backgroundColor};
          color: ${textColor};
        }
        .form__field-radio-group .radio:not(:last-child) header {
          border-bottom: 1px solid ${borderColor};
        }
        h1, h2 {
          font-size: 18px;
          color: ${textColor};
          margin: 0;
          font-weight: 500;
        }
        h3 {
          padding-left: 0px !important;
        }
        .plan__summary-total {
          font-size: 18px;
          color: ${textColor};
          border-top: 1px solid ${borderColor};
        }
      `;
    case 'default':
      return config.darkMode ? `
        /* Default dark mode style */
        body {
          background-color: ${backgroundColor};
        }
        .header, .header h1, .footer__operated-by-link, .footer__privacy-policy-link, h2, h3, h4 {
          color: #f9f9f9;
        }
        .content, .content__main, .form__field-radio-group {
          background-color: #232a31;
          color: #f9f9f9;
          border: 0px solid ${borderColor};
        }
        .content__headings,
        .content__heading--mobile,
        .form__section--credit-card header,
        .form__section--configure-plan .form__field--boxed,
        .form__section--billing-address .form__field-radio-group .radio header {
          background: #38434f;
          border: 1px solid ${borderColor};
        }
        .form__section--boxed header {
          border: 0px;
          border-bottom: 1px solid ${borderColor};
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }
        .content__heading {
          background: #38434f;
          border-bottom: 0px solid ${borderColor};
        }
        .form__field-radio-group .radio:not(:last-child) header {
          border-bottom: 1px solid ${borderColor};
        }
        .form__section--credit-card {
          border: 1px solid ${borderColor};
        }
        .content__main {
          border-right: 1px solid ${borderColor};
        }
      ` : `
        /* Default light mode style */
        body {
          background-color: ${backgroundColor};
        }
      `;
    default:
      return '';
  }
}

function generateMenuCSS(config) {
  if (!config.addMenu) return '';

  return `
    /* Styles for product selection menu */
    .product-selection-menu {
      display: flex;
      justify-content: space-between;
    }

    .packageSelection {
      flex: 1;
      text-align: center;
      padding: 20px;
      margin: 0 10px;
      background-color: #f5f7fa;
      color: #34495e;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s, color 0.3s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .packageSelection p {
      margin: 0;
    }

    .product-selection-menu a:first-child {
      margin-left: 0;
    }

    .product-selection-menu a:last-child {
      margin-right: 0;
    }

    .product-selection-menu a:hover {
      background-color: #e1e8ed;
      color: #34495e;
    }

    .product-selection-menu a.active {
      background-color: ${config.setAccentColor ? config.accentColor : '#3498db'};
      color: #ffffff;
    }

    .product-selection-menu a .caption {
      font-size: 0.9em;
      color: #7f8c8d;
      margin: 0;
    }

    .product-selection-menu a.active .caption {
      color: #ffffff;
    }
  `;
}

function prettifyGeneratedCSS(css) {
  return prettier.format(css, {
    parser: "css",
    plugins: prettierPlugins
  });
}
