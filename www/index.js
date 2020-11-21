;;
(async () => {
  const prefix = '/app/';

  function pfetch(url, payload = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-type', 'application/json');
      xhr.onload = () => resolve({
        json: () => JSON.parse(xhr.responseText)
      });
      xhr.onerror = (err) => reject(err);
      xhr.send(JSON.stringify(payload));
    })
  }

  Array.from(document.querySelectorAll('.tester'))
    .map(dom => {
      const {
        name,
        ...data
      } = dom.dataset;
      const ispost = dom.hasAttribute('post');
      const emptyData = () => Object.keys(data).length !== 0 && Object.keys(data).filter(k => data[k]).length === 0;
      const get = (payload) => emptyData() ? Promise.resolve(null) : (ispost ? pfetch : fetch)(`${prefix}${name}?${ispost ? '' : Object.keys(data).filter(k=>data[k]).reduce((acc,k)=>`${acc}&${k}=${data[k]}`,'')}`, payload);
      const inputs = Object.keys(data).map(k => {
        const dom = document.createElement('input');
        dom.placeholder = k;
        dom.value = data[k];
        dom.addEventListener('change', () => data[k] = dom.value);
        return dom;
      });
      const title = document.createElement('h3');
      title.innerHTML = name;
      const submit = document.createElement('button');
      submit.innerText = 'Submit' + (ispost ? '(POST)' : '');
      const resp = document.createElement('pre');
      const reload = async () => {
        resp.innerHTML = '>> loading... <<';
        const r = await get(data);
        if (r === null) {
          return resp.innerHTML = '';
        }
        const x = await r.json();
        resp.innerHTML = JSON.stringify(x, null, 2);
      }
      submit.addEventListener('click', reload);

      reload();
      [title, ...inputs, submit, resp].map(d => dom.appendChild(d));
    })

  const apis = document.querySelector('#apis');
  apis.innerHTML = await fetch('/apis')
    .then(r => r.json())
    .then(({
      result
    }) => result.join(' '));
})();