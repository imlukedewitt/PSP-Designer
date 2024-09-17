document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    addProductMenuButton: document.getElementById('add-product-menu-btn'),
    productMenuContainer: document.getElementById('product-menu-container'),
  };

  function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    Object.entries(options).forEach(([key, value]) => {
      if (key === 'classes') {
        value.forEach(cls => element.classList.add(cls));
      } else if (key === 'events') {
        value.forEach(event => element.addEventListener(event.type, event.handler));
      } else {
        element[key] = value;
      }
    });
    return element;
  }

  function createProductFieldElement() {
    const fieldDiv = createElement('div', { classes: ['product-field-pair'] });

    const urlLabel = createElement('label', { textContent: 'Product URL' });
    const urlInput = createElement('input', {
      type: 'text',
      classes: ['product-url-text'],
      placeholder: 'Enter Product URL',
      events: [{
        type: 'change',
        handler: updatePreview
      }]
    });

    const nameLabel = createElement('label', { textContent: 'Product Name' });
    const nameInput = createElement('input', {
      type: 'text',
      classes: ['product-name-text'],
      placeholder: 'Enter Product Name',
      events: [{
        type: 'change',
        handler: updatePreview
      }]
    });

    const descriptionLabel = createElement('label', { textContent: 'Product Description' });
    const descriptionInput = createElement('input', {
      type: 'text',
      classes: ['product-description-text'],
      placeholder: 'Enter Product Description',
      events: [{
        type: 'change',
        handler: updatePreview
      }]
    });

    const removeButton = createElement('button', {
      type: 'button',
      classes: ['remove-pair-btn'],
      textContent: 'Remove',
      events: [{
        type: 'click',
        handler: () => {
          elements.productMenuContainer.removeChild(fieldDiv);
          updateAccordionHeight(elements.productMenuContainer);
          updatePreview();
        }
      }]
    });

    [urlLabel, urlInput, nameLabel, nameInput, descriptionLabel, descriptionInput, removeButton].forEach(child => fieldDiv.appendChild(child));
    return fieldDiv;
  }

  function updateAccordionHeight(container) {
    const accordionContent = container.closest('.accordion-content');
    if (accordionContent) {
      accordionContent.style.maxHeight = `${accordionContent.scrollHeight}px`;
    }
  }

  function attachAddButtonEvent(button, container, createElementFunction) {
    button.addEventListener('click', () => {
      const newElement = createElementFunction(container);
      container.appendChild(newElement);
      updateAccordionHeight(container);
    });
  }

  attachAddButtonEvent(elements.addProductMenuButton, elements.productMenuContainer, createProductFieldElement);
});
