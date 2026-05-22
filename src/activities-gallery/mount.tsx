import { createRoot, type Root } from 'react-dom/client';

import { ActivitiesGalleryApp } from './components/ActivitiesGalleryApp';

let activitiesRoot: Root | null = null;
let mountedContainer: HTMLElement | null = null;

export function mountActivitiesGallery(containerId: string, apiBaseUrl: string) {
  const container = document.getElementById(containerId);
  if (!container) {
    unmountActivitiesGallery();
    return;
  }

  if (!activitiesRoot || mountedContainer !== container) {
    unmountActivitiesGallery();
    activitiesRoot = createRoot(container);
    mountedContainer = container;
  }

  activitiesRoot.render(<ActivitiesGalleryApp apiBaseUrl={apiBaseUrl} />);
}

export function unmountActivitiesGallery() {
  if (activitiesRoot) {
    activitiesRoot.unmount();
  }
  activitiesRoot = null;
  mountedContainer = null;
}
