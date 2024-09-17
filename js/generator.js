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

function generateVariables(config) {
  let variables = '';
  if (config.requirePhone || config.requireOrg || config.requireCustom) {
    variables += `var form = $("#signup-form");
    var submitBtn = $("#subscription_submit");
    var alertsContainer = $('<div class="content__alerts"></div>');
    $('.content__main').prepend(alertsContainer);`;
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
  if (config.productFields.length > 0) {
    handlers += `createProductSelectionMenu(${JSON.stringify(config.productFields, null, 2)});\n`;
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
