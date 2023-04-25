import { Notify } from 'notiflix';
import { load, save, clear } from '../utils/localStorageHandlers';
import { getLibraryMovies } from './fetchLibrary';
import { generatePagination } from './modules/generatePagination';
import { afterPaginationMove } from '../main';

const configNotiflix = {
  position: 'center-top',
};

export let myLibraryPage = 1;
export let myLibraryPageName = '';

export const watchedMoviesKey = 'watchedMovies';
export const queuedMoviesKey = 'queuedMovies';

export let watched = load(watchedMoviesKey, watched) || [];
export let queued = load(queuedMoviesKey, queued) || [];

const saveWatched = () => save(watchedMoviesKey, watched);
const saveQueued = () => save(queuedMoviesKey, queued);

export const setWatched = id => {
  watched = load(watchedMoviesKey) || [];

  if (watched.includes(id)) {
    Notify.warning('This movie is already in your watched list!', configNotiflix);
    return;
  }
  watched.push(id);
  try {
    saveWatched();
    Notify.success('The movie has been added to your watched list!', configNotiflix);
  } catch (error) {
    console.error(error.message);
    Notify.failure('Oops! Something went wrong. Please try again...', configNotiflix);
  }
};

export const setQueued = id => {
  queued = load(queuedMoviesKey) || [];

  if (queued.includes(id)) {
    Notify.warning('This movie is already in your queue!', configNotiflix);
    return;
  }
  queued.push(id);
  try {
    saveQueued();
    Notify.success('The movie has been added to your queue!', configNotiflix);
  } catch (error) {
    console.error(error.message);
    Notify.failure('Oops! Something went wrong. Please try again...', configNotiflix);
  }
};

export const clearItem = id => {
  watched = load(watchedMoviesKey) || [];
  queued = load(queuedMoviesKey) || [];
  let index;

  if (queued.includes(id)) {
    index = queued.indexOf(id);
    if (index >= 0) {
      queued.splice(index, 1);
    }

    try {
      saveQueued();
      Notify.success('The movie has been removed from your queue!', configNotiflix);
    } catch (error) {
      console.error(error.message);
      Notify.failure('Oops! Something went wrong. Please try again...', configNotiflix);
    }
  } else if (watched.includes(id)) {
    index = watched.indexOf(id);
    if (index >= 0) {
      watched.splice(index, 1);
    }

    try {
      saveWatched();
      Notify.success('The movie has been removed from your watched list!', configNotiflix);
    } catch (error) {
      console.error(error.message);
      Notify.failure('Oops! Something went wrong. Please try again...', configNotiflix);
    }
  }
};

export const generateMyLibraryMenu = perPage => {
  const galleryDOM = document.querySelector('.main-content__list');

  const watchedBtn = document.querySelector('#my-library-watched');
  watchedBtn.addEventListener('click', async () => {
    myLibraryPage = 1;
    myLibraryPageName = watchedMoviesKey;

    const currentlySelected = document.querySelector('.header__my-library-btn--selected');
    currentlySelected
      ? currentlySelected.classList.remove('header__my-library-btn--selected')
      : null;
    watchedBtn.classList.add('header__my-library-btn--selected');

    watched = load(watchedMoviesKey) || [];

    const neededMovies = watched.slice(0, perPage);

    const readyMovies = await getLibraryMovies(neededMovies);

    await renderMovies(galleryDOM, perPage, readyMovies);

    const pagination = await generatePagination(watched.length, perPage);
    pagination.on('afterMove', afterPaginationMove);
  });

  const queuedBtn = document.querySelector('#my-library-queued');
  queuedBtn.addEventListener('click', async () => {
    myLibraryPage = 1;
    myLibraryPageName = queuedMoviesKey;

    const currentlySelected = document.querySelector('.header__my-library-btn--selected');
    currentlySelected
      ? currentlySelected.classList.remove('header__my-library-btn--selected')
      : null;
    queuedBtn.classList.add('header__my-library-btn--selected');

    queued = load(queuedMoviesKey) || [];

    const neededMovies = queued.slice(0, perPage);

    const readyMovies = await getLibraryMovies(neededMovies);

    await renderMovies(galleryDOM, perPage, readyMovies);

    const pagination = await generatePagination(watched.length, perPage);
    pagination.on('afterMove', afterPaginationMove);
  });

  const clearWatchedBtn = document.querySelector('#my-library-clear-watched');
  clearWatchedBtn.addEventListener('click', async () => {
    galleryDOM.innerHTML = '';

    if (confirm('This will irreversibly clear your Watched library! Proceed?')) {
      try {
        clear(watchedMoviesKey);
      } catch (error) {
        Notify.failure('Failed clearing Watched library! Please try again...');
      }
    }
  });

  const clearQueuedBtn = document.querySelector('#my-library-clear-queued');
  clearQueuedBtn.addEventListener('click', async () => {
    galleryDOM.innerHTML = '';

    if (confirm('This will irreversibly clear your Queued library! Proceed?')) {
      try {
        clear(queuedMoviesKey);
      } catch (error) {
        Notify.failure('Failed clearing Queued library! Please try again...');
      }
    }
  });
};
