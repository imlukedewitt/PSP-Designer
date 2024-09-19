// This code is mostly redundant with the rest of the javascript in this project
// It is used to preview the changes made in the configuration page in real time

function decodeUrlParam(param) {
  if (!param || param.trim() === '') return '';
  let replacedString = param.replace(/\+/g, ' ');
  return decodeURIComponent(replacedString);
}

function getUrlParams() {
  const params = {};
  const queryString = window.location.search.slice(1);
  const pairs = queryString.split("&");
  pairs.forEach(pair => {
    const [key, value] = pair.split("=");
    params[decodeUrlParam(key)] = decodeUrlParam(value);
  });
  return params;
}

// Function to get configuration from URL parameters
function getConfigFromUrl() {
  const params = getUrlParams();

  const searchReplacePairs = JSON.parse(params.searchReplacePairs || '[]').map(pair => ({
    searchText: pair.searchText,
    replaceText: pair.replaceText
  }));

  const requiredCustomFieldNames = JSON.parse(params.requiredCustomFieldNames || '[]');
  const hiddenCustomFieldNames = JSON.parse(params.hiddenCustomFieldNames || '[]');

  // parse product fields and do decode uri for each field in each object
  const productFields = JSON.parse(params.productFields || '[]').map(field => {
    return {
      url: decodeUrlParam(field.url),
      name: decodeUrlParam(field.name),
      description: decodeUrlParam(field.description)
    };
  });

  return {
    disablePhone: params.disablePhone === 'true',
    disableCoupon: params.disableCoupon === 'true',
    disableEmail: params.disableEmail === 'true',
    disableOrg: params.disableOrg === 'true',
    requirePhone: params.requirePhone === 'true',
    hidePhone: params.hidePhone === 'true',
    requireOrg: params.requireOrg === 'true',
    hideOrg: params.hideOrg === 'true',
    requireCustom: requiredCustomFieldNames.length > 0,
    hideCustom: hiddenCustomFieldNames.length > 0,
    requiredCustomFieldNames,
    hiddenCustomFieldNames,
    setGoogleFont: params.setGoogleFont === 'true',
    googleFontName: params.googleFontName || '',
    hideRecurringFee: params.hideRecurringFee === 'true',
    hideComponentFee: params.hideComponentFee === 'true',
    hidePageHeader: params.hidePageHeader === 'true',
    hideProduct: params.hideProduct === 'true',
    searchReplacePairs,
    searchAndReplace: searchReplacePairs.length > 0,
    addMenu: params.addMenu === 'true',
    productFields: productFields
  };
}

function isAnyOptionSelected(config) {
  let isSelected = false;
  Object.entries(config).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        isSelected = true;
      }
    } else if (Boolean(value)) {
      isSelected = true;
    }
  });
  return isSelected;
}

function generateJS(config) {
  if (!isAnyOptionSelected(config)) {
    return '';
  }

  let generatedCode = `
    ${generateHelperFunctions(config)}
    ${generateVariables(config)}
    ${generateFieldHandlers(config)}
    ${generateSubmitHandler(config)}
    ${generateFormChangeHandler(config)}`;
  return generatedCode;
}

function generateVariables(config) {
  let variables = '';
  if (config.requirePhone || config.requireOrg || config.requireCustom) {
    variables += `var form = $("#signup-form");
    var submitBtn = $("#subscription_submit");
    var alertsContainer = $('<div class="content__alerts"></div>');
    $('.content__main .content__heading').after(alertsContainer);`;
  }
  if (config.requirePhone || config.hidePhone || config.disablePhone) variables += `var phoneField = $("#subscription_customer_attributes_phone");`;
  if (config.requireOrg || config.hideOrg || config.disableOrg) variables += `var orgField = $("#subscription_customer_attributes_organization");`;
  if (config.requireCustom) {
    const requiredCustomFieldNamesArray = JSON.stringify(config.requiredCustomFieldNames);
    variables += `var requiredCustomFieldNames = ${requiredCustomFieldNamesArray};
    var requiredCustomFields = requiredCustomFieldNames.map(name => selectCustomField(name));`;
  }
  if (config.hideCustom) {
    const hiddenCustomFieldNamesArray = JSON.stringify(config.hiddenCustomFieldNames);
    variables += `var hiddenCustomFieldNames = ${hiddenCustomFieldNamesArray};
    var hiddenCustomFields = hiddenCustomFieldNames.map(name => selectCustomField(name));`;
  }
  return variables;
}

function generateHelperFunctions(config) {
  let code = '';
  if (config.requirePhone || config.requireOrg || config.requireCustom) {
    code += `function addAsteriskToLabel(selector) {
      var label = $('label[for="' + selector.substring(1) + '"]');
      label.text(label.text() + " *");
    }
    function handleBlurEvent(field, errorMessage) {
      field.blur(function() {
        if ($(this).val() !== "") {
          hideError(field);
        } else {
          showFieldError(field, errorMessage);
        }
      });
    }
    function showFieldError(field, message) {
      field.parent().addClass("has-error");
      field.next('.error-message').remove(); // remove existing error message
      field.after('<span class="error-message">' + message + '</span>');
    }
    function hideError(field) {
      field.parent().removeClass("has-error");
      field.next('.error-message').remove(); // remove existing error message
    }
    function showAlert(message) {
      var alert = $('<div class="content__alert--danger" role="alert">' + message + '</div>');
      alertsContainer.append(alert);
    }
    function clearAlerts() {
      alertsContainer.empty();
    }`;
  }

  if (config.requireCustom || config.hideCustom) {
    code += `function selectCustomField(fieldName) {
      let fieldID = $(".form__section--additional-information label:contains('" + fieldName + "')").attr('for');
      return $("#" + fieldID);
    }`;
  }

  if (config.hideRecurringFee || config.hideComponentFee || config.searchAndReplace) {
    code += `function updateSummaryInfo() {
      ${config.hideRecurringFee ? `$('#summary-recurring-charges').hide();` : ''}
      ${config.hideComponentFee ? `$('.plan__summary-component').hide();` : ''}
      ${config.searchReplacePairs.map(pair => {
      if (pair.searchText && pair.replaceText) {
        return `searchAndReplace("${pair.searchText}", "${pair.replaceText}");`;
      }
    }).join('')}
      }
      $(document).bind("afterSummaryRefresh", updateSummaryInfo);`;
  }

  if (config.searchAndReplace) {
    code += `function searchAndReplace(ogText, newText) {
      // Traverse through the body and find all elements containing text
      $('body').find('h1, h2, h3, button, label, td, .form__header-section--title').each(function() {
        var element = $(this);
        element.contents().filter(function() {
          // Filter out only text nodes
          return this.nodeType === 3 && this.nodeValue.includes(ogText);
        }).each(function() {
          // Replace the text in text nodes
          this.nodeValue = this.nodeValue.replace(new RegExp(ogText, 'g'), newText);
        });
      });
    }`;
  }

  if (config.addMenu) {
    code += `
      function createProductSelectionMenu(options) {
        // Create a header and a div separately
        var header = $('<h3 class="form__section-heading">Product Selection</h3>');
        var menuDiv = $('<div class="product-selection-menu"></div>');
    
        // Get the current URL without query parameters
        var currentUrl = new URL(window.location.href);
        var currentBaseUrl = currentUrl.origin + currentUrl.pathname;

        // Loop through options to create links
        options.forEach(function (option) {
            // Get the base URL of the option without query parameters
            var optionUrl = option.url;

            var link = $('<a></a>')
                .attr('href', option.url)
                .addClass('packageSelection')
                .append($('<p></p>').text(option.name))
                .append($('<p></p>').addClass('caption').text(option.description));

            // Check if the current base URL matches the option base URL
            if (currentBaseUrl === optionUrl) {
                link.addClass('active');
            }

            // Append the link to the menuDiv
            menuDiv.append(link);
        });

        // Prepend the header and menuDiv to the form
        $('.content__signup-form').prepend(menuDiv).prepend(header);
      }`;
  }

  return code;
}

function generateFieldHandlers(config) {
  let handlers = '$(document).ready(function() {';
  if (config.requirePhone) {
    handlers += `
      addAsteriskToLabel("#subscription_customer_attributes_phone");
      handleBlurEvent(phoneField, "Phone number: cannot be blank.");`;
  }
  if (config.requireOrg) {
    handlers += `
      addAsteriskToLabel("#subscription_customer_attributes_organization");
      handleBlurEvent(orgField, "Organization: cannot be blank.");`;
  }
  if (config.requireCustom) {
    handlers += `
      requiredCustomFields.forEach(field => {
        handleBlurEvent(field, "cannot be blank.");
        addAsteriskToLabel("#" + field.attr("id"));
      });`;
  }
  if (config.hidePhone) {
    handlers += `$('.form__field--phone').hide();`;
  }
  if (config.hideOrg) {
    handlers += `$('.form__field--organization-name').hide();`;
  }
  if (config.hideCustom) {
    handlers += `
      hiddenCustomFields.forEach(field => {
        field.closest('.form__field-custom-field').hide();
      });`;
  }
  if (config.setGoogleFont) {
    handlers += `$('head').append('<link href="https://fonts.googleapis.com/css?family=${config.googleFontName}" rel="stylesheet" type="text/css">');
    $('body').css('font-family', '${config.googleFontName}, sans-serif');`
  }
  if (config.hideRecurringFee || config.hideComponentFee) {
    handlers += `updateSummaryInfo();`;
  }
  if (config.hidePageHeader) {
    handlers += `$('body .header').hide();`;
  }
  if (config.hideProduct) {
    handlers += `$('.content__main .content__heading').hide();`
  }
  if (config.disablePhone) {
    handlers += `phoneField.prop('disabled', true);`;
  }
  if (config.disableCoupon) {
    handlers += `$('#coupon_code').prop('disabled', true);`;
  }
  if (config.disableEmail) {
    handlers += `$('#subscription_customer_attributes_email').prop('disabled', true);`;
  }
  if (config.disableOrg) {
    handlers += `orgField.prop('disabled', true);`;
  }
  if (config.searchAndReplace) {
    config.searchReplacePairs.forEach(pair => {
      handlers += `searchAndReplace("${pair.searchText}", "${pair.replaceText}");`;
    });
  }
  if (config.addMenu) {
    const productFields = config.productFields;

    if (productFields.length > 0) {
      handlers += `createProductSelectionMenu(${JSON.stringify(productFields, null, 2)});\n`;
    }
  }
  return handlers + `});`;
}

function generateSubmitHandler(config) {
  if (!config.requirePhone && !config.requireOrg && !config.requireCustom) return '';
  let submitHandler = `submitBtn.click(function(e) {
    var hasError = false;
    clearAlerts();`;
  if (config.requirePhone) {
    submitHandler += `
      if (phoneField.val() === "") {
        showFieldError(phoneField, "Phone number: cannot be blank.");
        showAlert("Phone number: cannot be blank.");
        hasError = true;
      } else {
        hideError(phoneField);
      }`;
  }
  if (config.requireOrg) {
    submitHandler += `
      if (orgField.val() === "") {
        showFieldError(orgField, "Organization: cannot be blank.");
        showAlert("Organization: cannot be blank.");
        hasError = true;
      } else {
        hideError(orgField);
      }`;
  }
  if (config.requireCustom) {
    submitHandler += `
      requiredCustomFields.forEach((field, index) => {
        if (field.val() === "") {
          showFieldError(field, "cannot be blank");
          showAlert(requiredCustomFieldNames[index] + ": cannot be blank.");
          hasError = true;
        } else {
          hideError(field);
        }
      });`;
  }
  submitHandler += `
    if (hasError) {
      $('html, body').animate({ scrollTop: 0 }, 'fast');
      return false;
    } else {
      form.submit();
    }
  });`;
  return submitHandler;
}

function generateFormChangeHandler(config) {
  if (!config.requirePhone && !config.requireOrg && !config.requireCustom) return '';
  let formChangeHandler = `form.change(function() {
    let allFilled = true;`;
  if (config.requirePhone) {
    formChangeHandler += `
      if (phoneField.val() === "") {
        allFilled = false;
      }`;
  }
  if (config.requireOrg) {
    formChangeHandler += `
      if (orgField.val() === "") {
        allFilled = false;
      }`;
  }
  if (config.requireCustom) {
    formChangeHandler += `
      requiredCustomFields.forEach(field => {
        if (field.val() === "") {
          allFilled = false;
        }
      });`;
  }
  formChangeHandler += `
    if (allFilled) {
      submitBtn.click(function() {
        return true;
      });
    }
  });`;
  return formChangeHandler;
}

// Main function to load configuration from URL, generate the code and inject it
function previewPageModifications() {
  const config = getConfigFromUrl();
  const generatedJS = generateJS(config);

  if (generatedJS) {
    const scriptTag = document.createElement('script');
    scriptTag.textContent = generatedJS;
    document.body.appendChild(scriptTag);
  }
  generateCSS();
}

// Call the main function to preview the page modifications
previewPageModifications();


// -------------- CSS --------------


function generateCSS() {
  const params = getUrlParams();
  const config = {
    setAccentColor: params.setAccentColor === 'true',
    addMenu: params.addMenu === 'true',
    accentColor: params.accentColor || '#3498db',
    hoverColor: params.hoverColor || '#2980b9',
    setBackgroundColor: params.setBackgroundColor === 'true',
    backgroundColor: params.backgroundColor || '#ffffff',
    pageStyle: params.pageStyle || 'default',
    darkMode: params.darkMode === 'true'
  }

  const isDefaultConfig = !config.setAccentColor &&
    !config.addMenu &&
    !config.setBackgroundColor &&
    !config.darkMode &&
    config.pageStyle === 'default';

  if (isDefaultConfig) return;

  let generatedCSS = `
    ${generateAccentColorCSS(config)}
    ${generateThemeCSS(config)}
    ${generateMenuCSS(config)}
  `;
  if (generateCSS) {
    const styleTag = document.createElement('style');
    styleTag.textContent = generatedCSS;
    document.head.appendChild(styleTag);
  }
}


function generateAccentColorCSS(config) {
  if (!config.setAccentColor) return '';

  const accentColor = config.accentColor;
  const hoverColor = config.hoverColor;

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
      background-color: ${config.setAccentColor ? config.accentColor : '#3498db'};
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
        body {
          background-color: ${backgroundColor};
        }
      `;
    default:
      return '';
  }
}