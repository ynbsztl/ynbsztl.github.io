(() => {
  const mapElement = document.querySelector('#photo-map');
  if (mapElement && window.L) {
    const position = [Number(mapElement.dataset.lat), Number(mapElement.dataset.lng)];
    const map = L.map(mapElement, {scrollWheelZoom: false}).setView(position, 15);
    const status = document.querySelector('.photo-map-status');
    let loaded = false;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    tiles.on('tileload', () => { loaded = true; status.hidden = true; });
    tiles.on('tileerror', () => {
      if (!loaded) status.textContent = '地图暂时无法加载，可通过下方链接查看地点。';
    });
    tiles.addTo(map);
    const label = document.createElement('span');
    label.textContent = mapElement.dataset.location;
    L.marker(position, {
      title: mapElement.dataset.location,
      icon: L.divIcon({className: 'photo-map-pin', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 24]})
    }).addTo(map).bindPopup(label).openPopup();
  }

  const dialog = document.querySelector('.photo-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const links = Array.from(document.querySelectorAll('.photo-open'));
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('[aria-live]');
  let index = 0;
  let opener;
  function show(next) {
    index = (next + links.length) % links.length;
    const link = links[index];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    const settings = link.closest('figure').querySelector('.photo-settings').innerText;
    caption.textContent = `${index + 1} / ${links.length} · ${settings.replace(/\n/g, ' · ')}`;
  }
  links.forEach((link, i) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    show(i);
    dialog.showModal();
    document.documentElement.classList.add('photo-viewing');
  }));
  dialog.querySelector('.photo-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.photo-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.photo-next').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('photo-viewing');
    if (opener) opener.focus();
  });
})();
