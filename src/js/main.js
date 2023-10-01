import 'modern-normalize/modern-normalize.css';
import '../sass/main.scss';

import {
  fetchTrendingMovies,
  fetchMoviesBySearchQuery,
  fetchMovieById,
} from './modules/fetch-items';
import { renderMovies, renderModal } from './modules/render-items';
import {
  watched,
  queued,
  generateMyLibraryMenu,
  myLibraryPage,
  myLibraryPageName,
  watchedMoviesKey,
  queuedMoviesKey,
} from './modules/library-handlers';
import { getLibraryMovies } from './modules/get-library';
import { openMovieModal } from './modules/modal-handlers';
import './modules/students-modal-handlers';
import { fetchGenresList, changeGenresIdToName } from './utils/genres-to-id';
import { Notify } from 'notiflix';
import { generatePagination } from './modules/pagination';

let pageName = 'trending';
let perPage = 20;
let sitePage = 1;
let APIPage = 1;
let totalResults = 0;
const galleryDOM = document.querySelector('.main-content__list');
const headerCont = document.querySelector('.header__container');
const searchForm = document.querySelector('.header__form');
const myLibraryMenu = document.querySelector('.header__my-library-menu');
let query = '';
let pagination;
const paginationDOM = document.querySelector('#pagination');
const homeLink = document.querySelector('#home');
const myLibraryLink = document.querySelector('#my-library');
let genresDecodeArray = [];
const configNotiflix = {
  position: 'center-top',
};


const loadHome = async event => {
  event.preventDefault();
  homeLink.classList.add('header__nav-link--underline');
  myLibraryLink.classList.remove('header__nav-link--underline');

  headerCont.style.filter = 'blur(3px)';
  setTimeout(() => {
    headerCont.classList.remove('header__container--my-library');
    headerCont.classList.add('header__container--home');
    headerCont.style.filter = 'none';
    searchForm.classList.remove('header__form--hidden');
    myLibraryMenu.classList.add('header__my-library-menu--hidden');
  }, 250);

  galleryDOM.innerHTML = '';
  for (const elem of paginationDOM.querySelectorAll('*')) {
    elem.remove();
  }
  pageName = 'trending';
  onWindowLoad();
};

const loadMyLibrary = async event => {
  event.preventDefault();
  homeLink.classList.remove('header__nav-link--underline');
  myLibraryLink.classList.add('header__nav-link--underline');

  headerCont.style.filter = 'blur(3px)';
  setTimeout(() => {
    headerCont.classList.remove('header__container--home');
    headerCont.classList.add('header__container--my-library');
    headerCont.style.filter = 'none';
    myLibraryMenu.classList.remove('header__my-library-menu--hidden');
    searchForm.classList.add('header__form--hidden');
  }, 250);

  galleryDOM.innerHTML = '';
  for (const elem of paginationDOM.querySelectorAll('*')) {
    elem.remove();
  }
  pageName = 'myLibrary';
  generateMyLibraryMenu(perPage);
};

export const afterPaginationMove = async event => {
  sitePage = event.page;
  APIPage = event.page;

  if (pageName === 'trending') {
    const movies = await fetchTrendingMovies(sitePage);
    if (movies.results == null) {
      throw new Error(
        'Failed fetching today trending movies... Please reload the site to try again.'
      );
    }
    const readyMovies = movies.results.map(elem => {
      if (elem.genre_ids == undefined || !Array.isArray(elem.genre_ids)) {
        elem.genre_names = elem.genres.map(genre => genre.name);
        return elem;
      }

      elem.genre_names = changeGenresIdToName(elem.genre_ids, genresDecodeArray);
      return elem;
    });

    await renderMovies(galleryDOM, perPage, readyMovies);
  }

  if (pageName === 'searchQuery') {
    const movies = await fetchMoviesBySearchQuery(query, sitePage);

    const readyMovies = movies.results.map(elem => {
      if (elem.genre_ids == undefined || !Array.isArray(elem.genre_ids)) {
        elem.genre_names = elem.genres.map(genre => genre.name);
        return elem;
      }

      elem.genre_names = changeGenresIdToName(elem.genre_ids, genresDecodeArray);
      return elem;
    });

    galleryDOM.innerHTML = '';
    await renderMovies(galleryDOM, perPage, readyMovies);
  }

  if (pageName === 'myLibrary' && myLibraryPageName === watchedMoviesKey) {
    const neededMovies = watched.slice(
      myLibraryPage * perPage - 1,
      myLibraryPage * perPage - 1 + perPage
    );

    const readyMovies = await getLibraryMovies(neededMovies);

    await renderMovies(galleryDOM, perPage, readyMovies);
  }

  if (pageName === 'myLibrary' && myLibraryPageName === queuedMoviesKey) {
    const neededMovies = queued.slice(
      myLibraryPage * perPage - 1,
      myLibraryPage * perPage - 1 + perPage
    );

    const readyMovies = await getLibraryMovies(neededMovies);

    await renderMovies(galleryDOM, perPage, readyMovies);
  }
};

const onSearchFormSubmit = async event => {
  event.preventDefault();
  paginationDOM.style.visibility = 'hidden';
  query = searchForm.search.value.trim();
  const errorCaption = document.querySelector('.header__form-error-txt');
  errorCaption.classList.add('.header__form-error-txt--hidden');

  try {
    if (genresDecodeArray.length == 0) {
      throw new Error('Missing essential API data... Please refresh the site.');
    }
    if (query.length == 0) {
      errorCaption.classList.remove('.header__form-error-txt--hidden');
      throw new Error('Please enter meaningful query...');
    }

    const movies = await fetchMoviesBySearchQuery(query, 1);
    if (movies === null) {
      errorCaption.classList.remove('.header__form-error-txt--hidden');
      return;
    }

    totalResults = movies.total_results;

    const readyMovies = movies.results.map(elem => {
      if (elem.genre_ids == undefined || !Array.isArray(elem.genre_ids)) {
        elem.genre_names = elem.genres.map(genre => genre.name);
        return elem;
      }

      elem.genre_names = changeGenresIdToName(elem.genre_ids, genresDecodeArray);
      return elem;
    });

    galleryDOM.innerHTML = '';
    pageName = 'searchQuery';
    sitePage = 1;
    APIPage = 1;
    await renderMovies(galleryDOM, perPage, readyMovies);

    pagination = await generatePagination(totalResults, perPage);
    pagination.on('afterMove', afterPaginationMove);
    paginationDOM.style.visibility = 'visible';
  } catch (error) {
    Notify.failure(error.message, configNotiflix);
  }
};

const onMovieCardSelection = async event => {
  const targetLI = event.target.closest('li[data-movieid]');

  const modalDOM = document.querySelector('.modal__container');
  const movieID = targetLI.dataset.movieid;
  const movieObject = await fetchMovieById(movieID);

  if (movieObject instanceof Error) {
    Notify.failure(movieObject.message, configNotiflix);
    return;
  }

  if (
    movieObject.genres !== undefined ||
    Array.isArray(movieObject.genres) ||
    movieObject.genre_ids == undefined ||
    !Array.isArray(movieObject.genre_ids)
  ) {
    movieObject.genre_names = movieObject.genres.map(genre => genre.name);
  } else {
    movieObject.genre_names = changeGenresIdToName(movieObject.genre_ids, genresDecodeArray);
  }

  await renderModal(modalDOM, movieObject);
  await openMovieModal(movieID);
};

const onWindowLoad = async () => {
  try {
    const genresAPIResponse = await fetchGenresList();
    if (genresAPIResponse == null) {
      throw new Error('Failed loading essential API data. Please reload the site in a moment...');
    }
    genresDecodeArray = genresAPIResponse;

    searchForm.addEventListener('submit', onSearchFormSubmit);
    galleryDOM.addEventListener('click', onMovieCardSelection);
    homeLink.addEventListener('click', loadHome);
    myLibraryLink.addEventListener('click', loadMyLibrary);

    const movies = await fetchTrendingMovies(1);
    if (movies.results == null) {
      throw new Error(
        'Failed fetching today trending movies... Please reload the site to try again.'
      );
    }
    totalResults = movies.total_results;

    const readyMovies = movies.results.map(elem => {
      if (elem.genre_ids == undefined || !Array.isArray(elem.genre_ids)) {
        elem.genre_names = elem.genres.map(genre => genre.name);
        return elem;
      }

      elem.genre_names = changeGenresIdToName(elem.genre_ids, genresDecodeArray);
      return elem;
    });

    await renderMovies(galleryDOM, perPage, readyMovies);

    pagination = await generatePagination(totalResults, perPage);
    pagination.on('afterMove', afterPaginationMove);
  } catch (error) {
    Notify.failure(error.message, configNotiflix);
  }
};

window.addEventListener('load', onWindowLoad);
