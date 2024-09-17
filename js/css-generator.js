function generateCSS() {
  const config = {
    setAccentColor: document.getElementById('set-accent-color').checked,
    addMenu: $('#product-menu-container').children().length > 0
  }
  if (!config.setAccentColor && !config.addMenu) {
    document.getElementById('generated-css').textContent = '\n\n';
    return;
  }

  let generatedCSS = `
    ${generateAccentColorCSS(config)}
    ${generateMenuCSS(config)}
  `;
  generatedCSS = prettifyGeneratedCSS(generatedCSS);
  document.getElementById('generated-css').textContent = generatedCSS;
}

function generateAccentColorCSS(config) {
  const accentColor = document.getElementById('accent-color').value;
  const hoverColor = document.getElementById('hover-color').value;
  if (config.setAccentColor) {
    return `
      #subscription_submit, #form__section-apply-components, .form__button--primary, .btn-success {
        border: solid 2px ${accentColor};
        background-color: ${accentColor};
        color: #FFF;
      }
      #form__section-apply-components:hover, #subscription_submit:hover, .form__button--is-submitting, .form__button--primary:hover, .form__button--primary:active, .form__button--primary:focus, .form__button--primary:disabled, .btn-success:hover {
        background-color: ${hoverColor};
        border: solid 2px ${hoverColor};
        color: #FFF;
        background-image: none;
      }
      .plan__summary-total {
        color: ${accentColor};
      }
      .content__heading--mobile .content__heading-section--total {
        color: #ffffff;
      }
    `;
  } else return '';
}

function generateMenuCSS(config) {
  if (!config.addMenu) return '';
  return `
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
      background-color: #3498db;
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
