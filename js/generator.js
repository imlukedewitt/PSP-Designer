function updateEnabledItems(mainCheckboxId, condition, ...dependentCheckboxIds) {
  const mainCheckbox = document.getElementById(mainCheckboxId);
  dependentCheckboxIds.forEach(dependentCheckboxId => {
    const dependentCheckbox = document.getElementById(dependentCheckboxId);
    if (dependentCheckbox) {
      dependentCheckbox.disabled = condition(mainCheckbox.checked);
    }
  });
}

function toggleDisable(mainCheckboxId, ...dependentCheckboxIds) {
  updateEnabledItems(mainCheckboxId, checked => checked, ...dependentCheckboxIds);
}

function followDisable(mainCheckboxId, ...dependentCheckboxIds) {
  updateEnabledItems(mainCheckboxId, checked => !checked, ...dependentCheckboxIds);
}

function getConfig() {
  const searchReplacePairs = Array.from(document.querySelectorAll('.search-replace-pair')).map(pair => ({
    searchText: pair.querySelector('.search-text').value,
    replaceText: pair.querySelector('.replace-text').value
  })).filter(pair => pair.searchText);

  const requiredCustomFieldNames = Array.from(document.querySelectorAll('#require-custom-container .custom-field-text'))
    .map(input => input.value.trim())
    .filter(value => value);

  const hiddenCustomFieldNames = Array.from(document.querySelectorAll('#hide-custom-container .custom-field-text'))
    .map(input => input.value.trim())
    .filter(value => value);

  return {
    disablePhone: document.getElementById('disable-phone').checked,
    disableCoupon: document.getElementById('disable-coupon').checked,
    disableEmail: document.getElementById('disable-email').checked,
    disableOrg: document.getElementById('disable-org').checked,
    requirePhone: document.getElementById('require-phone').checked,
    hidePhone: document.getElementById('hide-phone').checked,
    requireOrg: document.getElementById('require-org').checked,
    hideOrg: document.getElementById('hide-org').checked,
    requireCustom: requiredCustomFieldNames.length > 0,
    hideCustom: hiddenCustomFieldNames.length > 0,
    requiredCustomFieldNames,
    hiddenCustomFieldNames,
    setGoogleFont: document.getElementById('set-gooogle-font').checked,
    googleFontName: document.getElementById('google-font-name').value,
    hideRecurringFee: document.getElementById('hide-recurring-fee').checked,
    hideComponentFee: document.getElementById('hide-component-fee').checked,
    hidePageHeader: document.getElementById('hide-page-header').checked,
    hideProduct: document.getElementById('hide-product-name').checked,
    searchReplacePairs,
    searchAndReplace: searchReplacePairs.length > 0,
    addMenu: $('#product-menu-container').children().length > 0,
    productFields: Array.from(document.querySelectorAll('#product-menu-container .product-field-pair')).map(pair => ({
      url: pair.querySelector('.product-url-text').value,
      name: pair.querySelector('.product-name-text').value,
      description: pair.querySelector('.product-description-text').value
    }))
  };
}

function isAnyOptionSelected(config = getConfig()) {
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

function generateJS(config = getConfig()) {
  if (!isAnyOptionSelected(config)) {
    document.getElementById('generated-js').textContent = '\n\n';
    return;
  }

  let generatedCode = `
    ${generateHelperFunctions(config)}
    ${generateVariables(config)}
    ${generateFieldHandlers(config)}
    ${generateSubmitHandler(config)}
    ${generateFormChangeHandler(config)}`;
  generatedCode = prettifyGeneratedCode(generatedCode);
  document.getElementById('generated-js').textContent = generatedCode;
}

function prettifyGeneratedCode(code) {
  return prettier.format(code, {
    parser: "babel",
    plugins: prettierPlugins,
    singleQuote: true,
  });
}

function generateHelperFunctions(config) {
  let code = '';
  if (config.requirePhone || config.requireOrg || config.requireCustom) {
    code += `// Functions to handle validation and error display
    function addAsteriskToLabel(selector) {
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
      alertsContainer.removeClass('hide');
    }
    function clearAlerts() {
      alertsContainer.empty();
      alertsContainer.addClass('hide');
    }`;
  }

  if (config.requireCustom || config.hideCustom) {
    code += `// Function to select custom fields by name
    function selectCustomField(fieldName) {
      let fieldID = $(".form__section--additional-information label:contains('" + fieldName + "')").attr('for');
      return $("#" + fieldID);
    }`;
  }

  if (config.hideRecurringFee || config.hideComponentFee || config.searchAndReplace) {
    code += `// Function to update summary information
    function updateSummaryInfo() {
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
    code += `// Function to perform search and replace in text nodes
    function searchAndReplace(ogText, newText) {
      $('body').find('h1, h2, h3, button, label, td, .form__header-section--title').each(function() {
        var element = $(this);
        element.contents().filter(function() {
          return this.nodeType === 3 && this.nodeValue.includes(ogText);
        }).each(function() {
          this.nodeValue = this.nodeValue.replace(new RegExp(ogText, 'g'), newText);
        });
      });
    }`;
  }

  if (config.addMenu) {
    code += `
      // Function to create product selection menu
      function createProductSelectionMenu(options) {
        var header = $('<h3 class="form__section-heading">Product Selection</h3>');
        var menuDiv = $('<div class="product-selection-menu"></div>');
        var currentUrl = new URL(window.location.href);
        var currentBaseUrl = currentUrl.origin + currentUrl.pathname;
        options.forEach(function (option) {
            var optionUrl = option.url;
            var link = $('<a></a>')
                .attr('href', option.url)
                .addClass('packageSelection')
                .append($('<p></p>').text(option.name))
                .append($('<p></p>').addClass('caption').text(option.description));
            if (currentBaseUrl === optionUrl) {
                link.addClass('active');
            }
            menuDiv.append(link);
        });
        $('.content__signup-form').prepend(menuDiv).prepend(header);
      }`;
  }

  return code;
}

function generateVariables(config) {
  let variables = '';
  if (config.requirePhone || config.requireOrg || config.requireCustom) {
    variables += `// Initialize common variables
    var form = $("#signup-form");
    var submitBtn = $("#subscription_submit");
    var alertsContainer = $('<div class="content__alerts hide"></div>');
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

function generateFieldHandlers(config) {
  let handlers = '$(document).ready(function() {';
  if (config.requirePhone) {
    handlers += `
      // Add asterisk and validation to phone field
      addAsteriskToLabel("#subscription_customer_attributes_phone");
      handleBlurEvent(phoneField, "Phone number: cannot be blank.");`;
  }
  if (config.requireOrg) {
    handlers += `
      // Add asterisk and validation to organization field
      addAsteriskToLabel("#subscription_customer_attributes_organization");
      handleBlurEvent(orgField, "Organization: cannot be blank.");`;
  }
  if (config.requireCustom) {
    handlers += `
      // Add asterisk and validation to custom fields
      requiredCustomFields.forEach(field => {
        handleBlurEvent(field, "cannot be blank.");
        addAsteriskToLabel("#" + field.attr("id"));
      });`;
  }
  if (config.hidePhone) {
    handlers += `
    // Hide phone field
    $('.form__field--phone').hide();`;
  }
  if (config.hideOrg) {
    handlers += `
    // Hide organization field
    $('.form__field--organization-name').hide();`;
  }
  if (config.hideCustom) {
    handlers += `
      // Hide custom fields
      hiddenCustomFields.forEach(field => {
        field.closest('.form__field-custom-field').hide();
      });`;
  }
  if (config.setGoogleFont) {
    handlers += `
    // Set Google font
    $('head').append('<link href="https://fonts.googleapis.com/css?family=${config.googleFontName}" rel="stylesheet" type="text/css">');
    $('body').css('font-family', '${config.googleFontName}, sans-serif');`
  }
  if (config.hideRecurringFee || config.hideComponentFee) {
    handlers += `
    // Update summary info on load
    updateSummaryInfo();`;
  }
  if (config.hidePageHeader) {
    handlers += `
    // Hide page header
    $('body .header').hide();`;
  }
  if (config.hideProduct) {
    handlers += `
    // Hide product name
    $('.content__main .content__heading').hide();`
  }
  if (config.disablePhone) {
    handlers += `
    // Disable phone field
    phoneField.prop('disabled', true);`;
  }
  if (config.disableCoupon) {
    handlers += `
    // Disable coupon field
    $('#coupon_code').prop('disabled', true);`;
  }
  if (config.disableEmail) {
    handlers += `
    // Disable email field
    $('#subscription_customer_attributes_email').prop('disabled', true);`;
  }
  if (config.disableOrg) {
    handlers += `
    // Disable organization field
    orgField.prop('disabled', true);`;
  }
  if (config.searchAndReplace) {
    config.searchReplacePairs.forEach(pair => {
      handlers += `
      // Perform search and replace
      searchAndReplace("${pair.searchText}", "${pair.replaceText}");`;
    });
  }
  if (config.productFields.length > 0) {
    handlers += `
    // Create product selection menu
    createProductSelectionMenu(${JSON.stringify(config.productFields, null, 2)});\n`;
  }
  return handlers + `});`;
}

function generateSubmitHandler(config) {
  if (!config.requirePhone && !config.requireOrg && !config.requireCustom) return '';
  let submitHandler = `// Validate required fields on submit
    submitBtn.click(function(e) {
    var hasError = false;
    clearAlerts();`;
  if (config.requirePhone) {
    submitHandler += `
      // Validate phone field on submit
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
      // Validate organization field on submit
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
      // Validate custom fields on submit
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
  let formChangeHandler = `// Enable submit button when all required fields are filled
  form.change(function() {
    let allFilled = true;`;
  if (config.requirePhone) {
    formChangeHandler += `
      // Check if phone field is filled
      if (phoneField.val() === "") {
        allFilled = false;
      }`;
  }
  if (config.requireOrg) {
    formChangeHandler += `
      // Check if organization field is filled
      if (orgField.val() === "") {
        allFilled = false;
      }`;
  }
  if (config.requireCustom) {
    formChangeHandler += `
      // Check if custom fields are filled
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
