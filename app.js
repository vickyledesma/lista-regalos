import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://hbjxmsnhgkdarfvdoexb.supabase.co',
  'sb_publishable_VKMtHSmk2XLTep0ljQcLwA_x9p9bS2f'
);

const sections = [
  { list: 'list-cocina', count: 'count-cocina', bar: 'bar-cocina' },
  { list: 'list-hogar',  count: 'count-hogar',  bar: 'bar-hogar'  },
  { list: 'list-jardin', count: 'count-jardin', bar: 'bar-jardin' },
];

async function loadState() {
  const hideLoader = () => {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    screen.classList.add('hide');
    setTimeout(() => screen.remove(), 400);
  };

  const { data, error } = await supabase.from('gifts').select('id, taken');
  if (error) { console.error(error); hideLoader(); return; }

  const takenSet = new Set(data.filter(r => r.taken).map(r => r.id));
  document.querySelectorAll('.checklist li').forEach(li => {
    if (takenSet.has(li.dataset.id)) li.classList.add('taken');
  });
  updateCounters();
  hideLoader();
}

window.toggle = async function(li) {
  if (li.classList.contains('taken')) return;
  if (li.classList.contains('loading')) return;

  const id = li.dataset.id;
  li.classList.add('loading');

  const { error } = await supabase.from('gifts').upsert({ id, taken: true });
  li.classList.remove('loading');

  if (!error) {
    li.classList.add('taken');
    updateCounters();
  } else {
    console.error(error);
    alert('Hubo un error al guardar. Intentá de nuevo.');
  }
};

supabase
  .channel('gifts-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, payload => {
    const { id, taken } = payload.new;
    const li = document.querySelector(`[data-id="${id}"]`);
    if (!li) return;
    if (taken) li.classList.add('taken');
    else li.classList.remove('taken');
    updateCounters();
  })
  .subscribe();

function updateCounters() {
  sections.forEach(({ list, count, bar }) => {
    const items = document.querySelectorAll(`#${list} li`);
    const done  = document.querySelectorAll(`#${list} li.taken`).length;
    const total = items.length;
    document.getElementById(count).textContent = `${done} / ${total}`;
    document.getElementById(bar).style.width = `${(done / total) * 100}%`;
  });
}

window.copyAlias = function() {
  const alias = document.getElementById('alias-val').textContent;
  navigator.clipboard.writeText(alias).then(() => {
    const btn = document.querySelector('.btn-pill');
    const txt = document.getElementById('btn-txt');
    btn.classList.add('copied');
    txt.textContent = 'Alias copiado ✓';
    setTimeout(() => {
      btn.classList.remove('copied');
      txt.textContent = 'Copiar alias';
    }, 2500);
  });
};

window.closeWelcome = function() {
  const overlay = document.getElementById('welcome-overlay');
  overlay.classList.add('hide');
  setTimeout(() => overlay.remove(), 400);
};

loadState();
