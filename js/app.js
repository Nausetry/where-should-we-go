// Entry point. Bare URL shows the create screen. ?trip=CODE shows the trip screen.
const root = document.getElementById('app');

async function start() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('trip');
  try {
    if (raw === null) {
      const { mountCreate } = await import('./views/create.js');
      mountCreate(root);
      return;
    }
    const code = raw.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      const { h, setKids, setTitle } = await import('./ui.js');
      setTitle('Trip not found | Where Should We Go?');
      setKids(
        root,
        h('header', { class: 'masthead' }, h('h1', { text: 'Trip not found' })),
        h('p', { 'data-testid': 'not-found', text: 'No trip found for this link. Check the code and try again.' }),
        h('div', { class: 'actions' }, h('a', { class: 'button', href: location.pathname, text: 'Plan a new trip' })),
      );
      return;
    }
    const { mountTrip } = await import('./views/trip.js');
    mountTrip(root, code);
  } catch (err) {
    root.textContent = '';
    const p = document.createElement('p');
    p.className = 'status-text';
    p.setAttribute('data-testid', 'start-error');
    p.setAttribute('role', 'alert');
    p.textContent = 'This page could not start. Check your connection and reload the page.';
    root.append(p);
    console.error(err);
  }
}

start();
