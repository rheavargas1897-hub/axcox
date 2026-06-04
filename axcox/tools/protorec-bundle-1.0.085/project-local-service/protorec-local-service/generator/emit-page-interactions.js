function emitPageInteractions(pageIR) {
  return `import React from 'react';

export type InteractionDescriptor = {
  id: string;
  kind: 'tabs' | 'carousel' | 'dismissible' | 'dropdown';
  sectionId: string;
  label: string;
  confidence: number;
  itemCount: number;
  defaultIndex?: number;
};

export const pageInteractions: InteractionDescriptor[] = ${JSON.stringify(pageIR.interactions, null, 2)};

const ACTIVE_CLASS_NAMES = ['active', 'is-active', 'selected', 'current', 'ant-tabs-tab-active', 'hammer-tabs-tab-active'];

function setNodeActive(node: Element, active: boolean) {
  ACTIVE_CLASS_NAMES.forEach((className) => {
    if (active) {
      node.classList.add(className);
    } else {
      node.classList.remove(className);
    }
  });

  if (node.getAttribute('role') === 'tab' || node.hasAttribute('aria-selected')) {
    node.setAttribute('aria-selected', active ? 'true' : 'false');
    node.setAttribute('tabindex', active ? '0' : '-1');
  }
}

function bindTabs(root: HTMLElement, descriptor: InteractionDescriptor) {
  const container = root.querySelector<HTMLElement>(
    \`[data-protorec-interaction-id="\${descriptor.id}"][data-protorec-interaction-kind="tabs"]\`
  );
  if (!container) {
    return () => undefined;
  }

  const tabs = Array.from(container.querySelectorAll<HTMLElement>(\`[data-protorec-tab-index][data-protorec-interaction-id="\${descriptor.id}"]\`))
    .sort((left, right) => Number(left.dataset.protorecTabIndex || 0) - Number(right.dataset.protorecTabIndex || 0));
  const panels = Array.from(container.querySelectorAll<HTMLElement>(\`[data-protorec-panel-index][data-protorec-interaction-id="\${descriptor.id}"]\`))
    .sort((left, right) => Number(left.dataset.protorecPanelIndex || 0) - Number(right.dataset.protorecPanelIndex || 0));

  if (tabs.length < 2) {
    return () => undefined;
  }

  const activate = (index: number) => {
    tabs.forEach((tab, tabIndex) => {
      tab.dataset.protorecTabActive = tabIndex === index ? 'true' : 'false';
      setNodeActive(tab, tabIndex === index);
    });

    panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === index;
      panel.dataset.protorecPanelActive = isActive ? 'true' : 'false';
      panel.hidden = !isActive;
    });
  };

  const initialIndex = tabs.findIndex((tab) => tab.dataset.protorecTabActive === 'true');
  activate(initialIndex >= 0 ? initialIndex : Math.max(0, descriptor.defaultIndex || 0));

  const cleanups = tabs.map((tab) => {
    const index = Number(tab.dataset.protorecTabIndex || 0);
    const onClick = (event: Event) => {
      event.preventDefault();
      activate(index);
    };

    tab.addEventListener('click', onClick);
    return () => tab.removeEventListener('click', onClick);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function bindDismissible(root: HTMLElement, descriptor: InteractionDescriptor) {
  const container = root.querySelector<HTMLElement>(
    \`[data-protorec-interaction-id="\${descriptor.id}"][data-protorec-interaction-kind="dismissible"]\`
  );
  if (!container) {
    return () => undefined;
  }

  const close = () => {
    container.dataset.protorecClosed = 'true';
    container.hidden = true;
  };

  const triggers = Array.from(root.querySelectorAll<HTMLElement>(\`[data-protorec-dismiss-trigger="\${descriptor.id}"]\`));
  const cleanups = triggers.map((trigger) => {
    const onClick = (event: Event) => {
      event.preventDefault();
      close();
    };

    trigger.addEventListener('click', onClick);
    return () => trigger.removeEventListener('click', onClick);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function bindCarousel(root: HTMLElement, descriptor: InteractionDescriptor) {
  const container = root.querySelector<HTMLElement>(
    \`[data-protorec-interaction-id="\${descriptor.id}"][data-protorec-interaction-kind="carousel"]\`
  );
  if (!container) {
    return () => undefined;
  }

  const slides = Array.from(container.querySelectorAll<HTMLElement>(\`[data-protorec-slide-index][data-protorec-interaction-id="\${descriptor.id}"]\`))
    .sort((left, right) => Number(left.dataset.protorecSlideIndex || 0) - Number(right.dataset.protorecSlideIndex || 0));

  if (slides.length < 2) {
    return () => undefined;
  }

  const activate = (nextIndex: number) => {
    const safeIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === safeIndex;
      slide.dataset.protorecSlideActive = isActive ? 'true' : 'false';
      slide.hidden = !isActive;
      setNodeActive(slide, isActive);
    });
  };

  activate(0);

  const controls = Array.from(container.querySelectorAll<HTMLElement>(\`[data-protorec-interaction-id="\${descriptor.id}"]\`));
  const cleanups = controls.map((control) => {
    const onClick = (event: Event) => {
      if (!control.matches('[data-protorec-carousel-prev], [data-protorec-carousel-next], [data-protorec-slide-target]')) {
        return;
      }

      event.preventDefault();
      const activeIndex = slides.findIndex((slide) => slide.dataset.protorecSlideActive === 'true');
      if (control.hasAttribute('data-protorec-carousel-prev')) {
        activate(activeIndex - 1);
        return;
      }

      if (control.hasAttribute('data-protorec-carousel-next')) {
        activate(activeIndex + 1);
        return;
      }

      const explicitTarget = Number(control.dataset.protorecSlideTarget || 0);
      activate(explicitTarget);
    };

    control.addEventListener('click', onClick);
    return () => control.removeEventListener('click', onClick);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function bindDropdown(root: HTMLElement, descriptor: InteractionDescriptor) {
  const container = root.querySelector<HTMLElement>(
    \`[data-protorec-interaction-id="\${descriptor.id}"][data-protorec-interaction-kind="dropdown"]\`
  );
  if (!container) {
    return () => undefined;
  }

  const trigger = container.querySelector<HTMLElement>(\`[data-protorec-dropdown-trigger="\${descriptor.id}"]\`);
  const menu = container.querySelector<HTMLElement>(\`[data-protorec-dropdown-menu="\${descriptor.id}"]\`);
  if (!trigger || !menu) {
    return () => undefined;
  }

  const ownerDocument = container.ownerDocument;
  const setOpen = (open: boolean) => {
    container.dataset.protorecOpen = open ? 'true' : 'false';
    menu.hidden = !open;
    setNodeActive(trigger, open);
  };

  setOpen(false);

  const onTriggerClick = (event: Event) => {
    event.preventDefault();
    setOpen(container.dataset.protorecOpen !== 'true');
  };
  const onDocumentClick = (event: Event) => {
    if (!(event.target instanceof Node) || container.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  trigger.addEventListener('click', onTriggerClick);
  ownerDocument.addEventListener('click', onDocumentClick);

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    ownerDocument.removeEventListener('click', onDocumentClick);
  };
}

function bindDescriptor(root: HTMLElement, descriptor: InteractionDescriptor) {
  switch (descriptor.kind) {
    case 'tabs':
      return bindTabs(root, descriptor);
    case 'carousel':
      return bindCarousel(root, descriptor);
    case 'dismissible':
      return bindDismissible(root, descriptor);
    case 'dropdown':
      return bindDropdown(root, descriptor);
    default:
      return () => undefined;
  }
}

export function useProtoPageInteractions(
  rootRef: React.RefObject<HTMLElement>,
  descriptors: InteractionDescriptor[]
) {
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') {
      return undefined;
    }

    const cleanups = descriptors.map((descriptor) => bindDescriptor(root, descriptor));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [rootRef, descriptors]);
}
`;
}

module.exports = {
  emitPageInteractions
};
