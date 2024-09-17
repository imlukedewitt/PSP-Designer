document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    addPairButton: document.getElementById('add-pair-btn'),
    searchReplaceContainer: document.getElementById('search-replace-container'),
    addRequireCustomButton: document.getElementById('add-require-custom-btn'),
    requireCustomContainer: document.getElementById('require-custom-container'),
    addHideCustomButton: document.getElementById('add-hide-custom-btn'),
    hideCustomContainer: document.getElementById('hide-custom-container')
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

  function createPairElement() {
    const pairDiv = createElement('div', { classes: ['search-replace-pair'] });

    const searchInput = createElement('input', {
      type: 'text',
      classes: ['search-text'],
      placeholder: 'Search Text',
      events: [{
        type: 'change',
        handler: updatePreview
      }]
    });

    const replaceInput = createElement('input', {
      type: 'text',
      classes: ['replace-text'],
      placeholder: 'Replace Text',
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
          elements.searchReplaceContainer.removeChild(pairDiv);
          updateAccordionHeight(elements.searchReplaceContainer);
          updatePreview();
        }
      }]
    });

    [searchInput, replaceInput, removeButton].forEach(child => pairDiv.appendChild(child));
    return pairDiv;
  }

  function createCustomFieldElement(container) {
    const fieldDiv = createElement('div', { classes: ['custom-field-pair'] });

    const fieldInput = createElement('input', {
      type: 'text',
      classes: ['custom-field-text'],
      placeholder: 'Custom Field Name',
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
          container.removeChild(fieldDiv);
          updateAccordionHeight(container);
          updatePreview();
        }
      }]
    });

    [fieldInput, removeButton].forEach(child => fieldDiv.appendChild(child));
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

  attachAddButtonEvent(elements.addPairButton, elements.searchReplaceContainer, createPairElement);
  attachAddButtonEvent(elements.addRequireCustomButton, elements.requireCustomContainer, createCustomFieldElement);
  attachAddButtonEvent(elements.addHideCustomButton, elements.hideCustomContainer, createCustomFieldElement);
});
