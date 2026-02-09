import './style.css';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (container: HTMLElement, options: Record<string, string>) => void;
        };
      };
    };
    openGalleryUpload?: (year: number) => void;
    openGalleryView?: (year: number) => void;
    closeGalleryUpload?: () => void;
    closeGalleryView?: () => void;
    submitGalleryUpload?: () => void;
    galleryPrev?: () => void;
    galleryNext?: () => void;
    gallerySetIndex?: (index: number) => void;
  }
}

type UserProfile = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  about?: string;
  favoriteColor?: string;
  nickname?: string;
  favoriteFood?: string;
  participationYears?: number[];
  pastExperience?: string;
  showProfile?: boolean;
  picture?: string;
  firstTaskCompletedAt?: string | null;
};

type GallerySummary = Record<number, number>;
type TaskResult = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  picture?: string;
  firstTaskCompletedAt?: string | null;
};

const GOOGLE_CLIENT_ID = '230576623376-0gdvkur7dt49lea75pq9am271r6scjdq.apps.googleusercontent.com';
const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL_DEV ?? 'http://localhost:3001'
  : import.meta.env.VITE_API_BASE_URL ?? '';

const loadUser = (): UserProfile | null => {
  const stored = localStorage.getItem('boat_trip_user');
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
};

const saveUser = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem('boat_trip_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('boat_trip_user');
  }
};

const setCurrentUser = (user: UserProfile | null) => {
  currentUser = user;
  saveUser(user);
  render();
};

let currentUser = loadUser();
let authError: string | null = null;
let authLoading = false;
let authMode: 'login' | 'register' = 'login';
let profileError: string | null = null;
let profileLoading = false;
let profileUploading = false;
let profileMode: 'view' | 'edit' = 'view';
let firstTaskLoading = false;
let firstTaskChecking = false;
let firstTaskChecked = false;
let firstTaskError: string | null = null;
let resultsLoading = false;
let resultsError: string | null = null;
let firstTaskResults: TaskResult[] = [];
let resultsLoaded = false;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProfileDefaults = () => {
  const name = currentUser?.name ?? '';
  const [firstNameFromName, ...lastNameParts] = name.split(' ').filter(Boolean);
  const lastNameFromName = lastNameParts.join(' ');

  return {
    firstName: currentUser?.firstName ?? firstNameFromName ?? '',
    lastName: currentUser?.lastName ?? lastNameFromName ?? '',
    about: currentUser?.about ?? '',
    favoriteColor: currentUser?.favoriteColor ?? '#0f172a',
      nickname: currentUser?.nickname ?? '',
      favoriteFood: currentUser?.favoriteFood ?? '',
    participationYears: currentUser?.participationYears ?? [],
    pastExperience: currentUser?.pastExperience ?? '',
    showProfile: currentUser?.showProfile ?? false,
  };
};

const profilePage = () => {
  const defaults = getProfileDefaults();
  const safeFirstName = escapeHtml(defaults.firstName);
  const safeLastName = escapeHtml(defaults.lastName);
  const safeAbout = escapeHtml(defaults.about);
  const safeNickname = escapeHtml(defaults.nickname);
  const safeFavoriteFood = escapeHtml(defaults.favoriteFood);
  const safePastExperience = escapeHtml(defaults.pastExperience);
  const safeName = escapeHtml(currentUser?.name ?? '');
  const pictureUrl = currentUser?.picture ? escapeHtml(currentUser.picture) : '';
  const favoriteColor = escapeHtml(defaults.favoriteColor);
  const yearsSelected = defaults.participationYears ?? [];
  const yearsCount = yearsSelected.length;

  const header = `
    <section
      class="rounded-3xl border border-white/5 bg-white/5 p-8"
      style="background: linear-gradient(140deg, ${favoriteColor}55, transparent 50%)"
    >
      <h2 class="text-center text-lg font-light uppercase tracking-[0.35em] text-slate-300">
        Mans profils
      </h2>
      <div class="mt-6 flex justify-center">
        ${
          pictureUrl
            ? `<img class="h-56 w-56 rounded-full border border-white/10 object-cover" src="${pictureUrl}" alt="${safeName}" />`
            : `<div class="flex h-56 w-56 items-center justify-center rounded-full border border-white/10 text-xs uppercase tracking-[0.2em] text-slate-500">Foto</div>`
        }
      </div>
  `;

  if (profileMode === 'view') {
    return `
      ${header}
      <div class="mt-3 flex justify-center">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-500">
          <span>${defaults.showProfile ? 'Redzams' : 'Slēpts'}</span>
          <span>pārējiem</span>
        </span>
      </div>
      <div class="mt-8 grid gap-6 text-sm text-slate-300">
        <div class="grid gap-2 sm:grid-cols-2">
          <div class="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Vārds</p>
            <p class="mt-2 text-slate-100">${safeFirstName || '—'}</p>
          </div>
          <div class="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Uzvārds</p>
            <p class="mt-2 text-slate-100">${safeLastName || '—'}</p>
          </div>
          <div class="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Iesauka</p>
            <p class="mt-2 text-slate-100">${safeNickname || '—'}</p>
          </div>
          <div class="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Mīļākais ēdiens</p>
            <p class="mt-2 text-slate-100">${safeFavoriteFood || '—'}</p>
          </div>
        </div>
        <div class="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Par mani</p>
          <p class="mt-2 text-slate-100">${safeAbout || '—'}</p>
        </div>
        <div class="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Cik gadus esi piedalījies</p>
          <p class="mt-2 text-slate-100">${yearsCount || '—'}</p>
          ${
            yearsCount
              ? `<p class="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">${yearsSelected.join(', ')}</p>`
              : ''
          }
        </div>
        <button
          class="w-fit rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-white"
          id="profile-edit"
          type="button"
        >
          Rediģēt profilu
        </button>
      </div>
    </section>
    `;
  }

  return `
    ${header}
    <div class="mt-8 grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          Vārds
          <input
            class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
            id="profile-first-name"
            type="text"
            value="${safeFirstName}"
          />
        </label>
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          Uzvārds
          <input
            class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
            id="profile-last-name"
            type="text"
            value="${safeLastName}"
          />
        </label>
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          Iesauka
          <input
            class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
            id="profile-nickname"
            type="text"
            value="${safeNickname}"
          />
        </label>
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          Mīļākais ēdiens
          <input
            class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
            id="profile-favorite-food"
            type="text"
            value="${safeFavoriteFood}"
          />
        </label>
      </div>
      <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        Par mani
        <textarea
          class="min-h-[120px] rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
          id="profile-about"
          placeholder="Daži teikumi par sevi"
        >${safeAbout}</textarea>
      </label>
      <div class="grid gap-3">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Dalības gadi</p>
        <div class="flex flex-wrap gap-2">
          ${[2020, 2021, 2022, 2023, 2024, 2025]
            .map((year) => {
              const checked = yearsSelected.includes(year) ? 'checked' : '';
              return `
            <label class="inline-flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              <input
                class="h-3.5 w-3.5 rounded border border-slate-600 bg-slate-950 text-slate-200 focus:ring-0"
                type="checkbox"
                value="${year}"
                ${checked}
                data-participation-year
              />
              ${year}
            </label>
          `;
            })
            .join('')}
        </div>
      </div>
      <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        Ja esi iepriekš piedalījies, pastāsti par savu pieredzi vienā teikumā
        <input
          class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
          id="profile-experience"
          type="text"
          value="${safePastExperience}"
        />
      </label>
      <div class="flex flex-wrap items-center gap-4">
        <input
          class="block text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-white"
          id="profile-image"
          type="file"
          accept="image/*"
        />
        <button
          class="rounded-full border border-slate-700/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          id="profile-upload"
          type="button"
        >
          ${profileUploading ? 'Augšupielādējam...' : 'Augšupielādēt attēlu'}
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-6">
        <label class="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          Mīļākā krāsa
          <input
            class="h-10 w-16 cursor-pointer rounded-xl border border-slate-700/70 bg-transparent p-1"
            id="profile-color"
            type="color"
            value="${favoriteColor}"
          />
        </label>
        <div class="flex flex-wrap items-center gap-2" id="color-presets">
          ${['#0f172a', '#0ea5e9', '#10b981', '#f97316', '#f43f5e', '#a855f7', '#facc15', '#ffffff']
            .map(
              (color) => `
            <button
              class="h-8 w-8 rounded-full border border-white/10 transition hover:scale-105"
              data-color="${color}"
              style="background-color: ${color}"
              type="button"
              aria-label="Krāsa ${color}"
            ></button>
          `,
            )
            .join('')}
        </div>
        <label class="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <input
            class="h-4 w-4 rounded border border-slate-600 bg-slate-950 text-slate-200 focus:ring-0"
            id="profile-show"
            type="checkbox"
            ${defaults.showProfile ? 'checked' : ''}
          />
          Attēlot profīlu pārējiem
        </label>
      </div>
      ${
        profileError
          ? `<p class="text-sm text-rose-300">${escapeHtml(profileError)}</p>`
          : ''
      }
      <div class="flex flex-wrap items-center gap-3">
        <button
          class="w-fit rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-white"
          id="profile-save"
          type="button"
        >
          ${profileLoading ? 'Saglabājam...' : 'Saglabāt'}
        </button>
        <button
          class="w-fit rounded-full border border-slate-700/70 px-5 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          id="profile-cancel"
          type="button"
        >
          Atcelt
        </button>
      </div>
    </div>
  </section>
  `;
};

const authPage = () => `
  <section class="rounded-3xl border border-white/5 bg-white/5 p-8">
    <h2 class="text-lg font-light uppercase tracking-[0.35em] text-slate-300">
      ${authMode === 'login' ? 'Ienākt profilā' : 'Izveidot profilu'}
    </h2>
    <p class="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
      Pieslēdzies vai izveido profilu, lai redzētu detalizētu maršrutu un
      pieteiktu dalību.
    </p>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        E-pasts
        <input
          class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
          placeholder="vards@pasts.lv"
          id="auth-email"
          type="email"
        />
      </label>
      ${
        authMode === 'register'
          ? `
      <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        Vārds
        <input
          class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
          placeholder="Jūsu vārds"
          id="auth-name"
          type="text"
        />
      </label>
      `
          : ''
      }
      <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        Parole
        <input
          class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
          placeholder="••••••••"
          id="auth-password"
          type="password"
        />
      </label>
    </div>
    ${
      authError
        ? `<p class="mt-4 text-sm text-rose-300">${authError}</p>`
        : ''
    }
    ${
      authMode === 'login'
        ? `
    <div class="mt-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
      <span class="h-px w-10 bg-slate-700"></span>
      <span>vai ar Google</span>
  </div>
    <div class="mt-5" id="google-signin-button"></div>
    `
        : ''
    }
    <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
      <button
        class="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-white"
        id="auth-submit"
        type="button"
      >
        ${
          authMode === 'login'
            ? authLoading
              ? 'Ienākšana...'
              : 'Ienākt'
            : authLoading
              ? 'Reģistrējam...'
              : 'Reģistrēties'
        }
      </button>
      <span class="text-sm text-slate-400">
        ${
          authMode === 'login'
            ? `Nav profila? <button class="text-slate-200 underline underline-offset-4" id="switch-to-register" type="button">Reģistrēties</button>`
            : `Ir profils? <button class="text-slate-200 underline underline-offset-4" id="switch-to-login" type="button">Ienākt</button>`
        }
      </span>
    </div>
  </section>
`;

const pages: Record<string, string> = {
  '/': `
    <div class="flex min-h-[70vh] flex-col items-center justify-center gap-10">
      <div class="w-full max-w-4xl">
        <div class="mb-6 flex justify-center">
          <h2
            class="max-w-3xl text-center text-2xl font-semibold text-white sm:text-3xl lg:text-4xl"
            id="experience-text"
          ></h2>
        </div>
        <div class="relative">
          <div class="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-slate-700/30 via-transparent to-slate-500/30 blur-2xl"></div>
          <img
            src="/main.jpeg"
            alt="Laivu brauciens"
            class="relative h-[70vh] w-full rounded-[32px] border border-white/10 object-cover shadow-2xl"
          />
        </div>
      </div>
      <div class="text-center">
        <p class="text-xs uppercase tracking-[0.35em] text-slate-400">
          Laiks līdz nākošajam laivu braucienam
        </p>
        <div class="mt-3 grid gap-3 text-lg text-slate-100 sm:grid-cols-4 sm:text-2xl">
          <div class="rounded-full border border-white/10 px-4 py-2">
            <span id="countdown-days">--</span>
            <span class="ml-2 text-xs uppercase tracking-[0.35em] text-slate-400">dienas</span>
          </div>
          <div class="rounded-full border border-white/10 px-4 py-2">
            <span id="countdown-hours">--</span>
            <span class="ml-2 text-xs uppercase tracking-[0.35em] text-slate-400">stundas</span>
          </div>
          <div class="rounded-full border border-white/10 px-4 py-2">
            <span id="countdown-minutes">--</span>
            <span class="ml-2 text-xs uppercase tracking-[0.35em] text-slate-400">minūtes</span>
          </div>
          <div class="rounded-full border border-white/10 px-4 py-2">
            <span id="countdown-seconds">--</span>
            <span class="ml-2 text-xs uppercase tracking-[0.35em] text-slate-400">sekundes</span>
          </div>
        </div>
      </div>
    </div>
  `,
  '/apraksts': `
    <section class="rounded-3xl border border-white/5 bg-white/5 p-8">
      <div class="mt-2 space-y-6 text-sm text-slate-300">
        <div class="space-y-2 text-base text-slate-100">
          <p class="text-center text-xl font-semibold text-white sm:text-2xl">
            Superīgākais un izcilākais vasaras pasākums!
          </p>
          <p>Katru gadu es ielieku sirdi un darbu, lai noorganizētu vienu ellīgi fantastisku laivošanas piedzīvojumu.</p>
        </div>

        <div class="space-y-2">
          <h3 class="text-xs uppercase tracking-[0.3em] text-slate-400">Kā tas parasti notiek</h3>
          <p class="text-slate-200">Apmēram pusgadu pirms pasākuma</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Es izvēlos upi, pa kuru laivosim.</li>
            <li>Ar jūsu iesaisti vienojamies par nedēļas nogali, kas der lielākajai daļai.</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p class="text-slate-200">Sagatavošanās (nākamie mēneši)</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Es saorganizēju visu nepieciešamo.</li>
            <li>Laicīgi saņemat maksājuma pieprasījumu, kas sedz:</li>
          </ul>
          <ul class="list-disc space-y-1 pl-10">
            <li>laivas,</li>
            <li>viesu namu,</li>
            <li>organizēšanu,</li>
            <li>balvas,</li>
            <li>pārtiku.</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p class="text-slate-200">Pasākuma norise (izvēlētajā nedēļas nogalē)</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>No rīta tiekamies manis norādītajā vietā (parasti viesu namā).</li>
            <li>Dodamies uz laivošanas startu (tiek sagatavots autobuss vai arī organizējamies savā starpā, lai visus nogādātu).</li>
            <li>Laivojam visu dienu — pa vidu vadu spēles, uzdevumus un aktivitātes.</li>
            <li>Uz vakarpusi nonākam finišā.</li>
            <li>Dodamies uz viesu namu.</li>
            <li>Tie, kas paliek pa nakti, iekārtojas nakšņošanas telpās.</li>
            <li>Pabeidzam aktivitātes un apbalvojam uzvarētājus.</li>
            <li>Visi kopā iesaistoties sagatavojam ēdienu.</li>
            <li>Pārejam neoficiālajā daļā: kas vēlas, dodas mājās; pārējie paliek un atpūšas.</li>
          </ul>
        </div>
      </div>
    </section>
  `,
  '/dalibnieki': '',
  '/galerija': '',
  '/autentifikacija': '',
  '/profils': '',
};

const labiPage = () => `
  <section class="flex min-h-[60vh] items-center justify-center">
    ${
      !currentUser
        ? `
          <p class="max-w-xl text-center text-base text-slate-200 sm:text-lg">
            Reģistrējies vai ienāc profīlā, lai piedalītos konkursā!
          </p>
        `
        : currentUser.firstTaskCompletedAt
          ? `
          <p class="max-w-xl text-center text-base text-slate-200 sm:text-lg">
            Apsveicu, jūs esat izpildijis pirmo uzdevumu!
          </p>
        `
          : `
          <div class="flex flex-col items-center gap-4">
            <button
              class="rounded-full border border-white/10 bg-slate-100 px-12 py-6 text-2xl font-semibold text-slate-900 shadow-2xl transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-60"
              id="first-task-button"
              type="button"
              ${firstTaskLoading ? 'disabled' : ''}
            >
              ${firstTaskLoading ? 'Saglabājam...' : 'Nospied mani!'}
            </button>
            ${
              firstTaskError
                ? `<p class="text-sm text-rose-300">${escapeHtml(firstTaskError)}</p>`
                : ''
            }
          </div>
        `
    }
  </section>
`;

const getRoute = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const [pathPart] = hash.split('?');
    return pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  }
  const path = window.location.pathname || '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const getResultsRoute = () => {
  const hash = window.location.hash.replace('#', '');
  const path = hash ? (hash.split('?')[0] ?? '') : '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const directPath = normalized.startsWith('/rezultati') ? normalized : '/rezultati';
  const subPath = directPath.replace('/rezultati', '').replace(/^\//, '');
  return subPath || 'pirmais';
};

const resultsTabLabel = (tab: string) => {
  switch (tab) {
    case 'pirmais':
      return 'Pirmais uzdevums';
    case 'otrais':
      return 'Otrais uzdevums';
    case 'tresais':
      return 'Trešais uzdevums';
    case 'ceturtais':
      return 'Ceturtais uzdevums';
    case 'piektais':
      return 'Piektais uzdevums';
    default:
      return 'Pirmais uzdevums';
  }
};

const formatParticipantName = (user: TaskResult) => {
  const firstName = user.firstName?.trim() ?? '';
  const lastName = user.lastName?.trim() ?? '';
  return `${firstName} ${lastName}`.trim() || user.name || 'Dalībnieks';
};

const resultsPage = () => {
  const tab = getResultsRoute();
  const tabs = ['pirmais', 'otrais', 'tresais', 'ceturtais', 'piektais'];
  const currentLabel = resultsTabLabel(tab);
  const isFirst = tab === 'pirmais';
  const listContent = isFirst
    ? resultsLoading
      ? `<p class="text-sm text-slate-400">Ielādējam rezultātus...</p>`
      : resultsError
        ? `<p class="text-sm text-rose-300">${escapeHtml(resultsError)}</p>`
        : firstTaskResults.length
          ? `<ol class="space-y-2">
              ${firstTaskResults
                .map((user, index) => {
                  const displayName = escapeHtml(formatParticipantName(user));
                  return `
                <li class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <span class="w-7 text-center text-sm text-slate-400">${index + 1}.</span>
                  <span class="text-sm text-slate-100">${displayName}</span>
                </li>
              `;
                })
                .join('')}
            </ol>`
          : `<p class="text-sm text-slate-400">Pagaidām nav rezultātu.</p>`
    : `<p class="text-sm text-slate-400">Rezultāti tiks papildināti drīzumā.</p>`;

  return `
    <section class="rounded-3xl border border-white/5 bg-white/5 p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-lg font-light uppercase tracking-[0.35em] text-slate-300">
            Rezultāti
          </h2>
          <span class="text-xs uppercase tracking-[0.3em] text-slate-500">${currentLabel}</span>
        </div>
        <nav class="flex flex-wrap gap-2 text-xs sm:text-sm">
          ${tabs
            .map((item) => {
              const isActive = item === tab;
              return `
                <a
                  class="rounded-t-2xl border border-b-0 px-3 py-2 transition ${
                    isActive
                      ? 'border-white/30 bg-slate-900/80 text-white shadow-[0_-1px_0_0_rgba(255,255,255,0.12)_inset]'
                      : 'border-white/10 bg-slate-950/30 text-slate-300 hover:border-white/30 hover:bg-slate-900/40'
                  }"
                  href="#/rezultati/${item}"
                >
                  ${resultsTabLabel(item)}
                </a>
              `;
            })
            .join('')}
        </nav>
        <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
          ${listContent}
        </div>
      </div>
    </section>
  `;
};

const handleHashChange = () => {
  render();
};

function initGoogleSignIn(attempt = 0) {
  const container = document.getElementById('google-signin-button');
  if (!container) {
    return;
  }

  const google = window.google;
  if (!google?.accounts?.id) {
    if (attempt < 10) {
      container.innerHTML = `
        <p class="text-sm text-slate-400">
          Ielādējam Google pieteikšanos...
        </p>
      `;
      window.setTimeout(() => initGoogleSignIn(attempt + 1), 500);
      return;
    }

    container.innerHTML = `
      <p class="text-sm text-slate-400">
        Google pieteikšanās nav pieejama. Lūdzu, pārbaudi savienojumu.
      </p>
    `;
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async ({ credential }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ credential }),
        });

        if (!response.ok) {
          throw new Error('Auth failed');
        }

        const data = (await response.json()) as { user: UserProfile };
        setCurrentUser(data.user);
        window.location.hash = '#/profils';
        window.location.reload();
      } catch (error) {
        container.innerHTML = `
          <p class="text-sm text-slate-400">
            Neizdevās pieslēgties. Lūdzu, mēģini vēlreiz.
          </p>
        `;
      }
    },
  });

  container.innerHTML = '';
  google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
  });
}




const render = () => {
  currentUser = loadUser();
  if (!currentUser) {
    galleryUploadOpen = false;
    galleryUploadYear = null;
    galleryUploadError = null;
    firstTaskLoading = false;
    firstTaskChecking = false;
    firstTaskChecked = false;
    firstTaskError = null;
  }
  const path = getRoute();
  const resolvedPath = !currentUser && path === '/profils' ? '/autentifikacija' : path;
  const page =
    resolvedPath === '/profils'
      ? profilePage()
      : resolvedPath === '/autentifikacija'
        ? authPage()
        : resolvedPath === '/dalibnieki'
          ? participantsPage()
          : resolvedPath === '/galerija'
            ? galleryPage()
            : resolvedPath.startsWith('/rezultati')
              ? resultsPage()
              : resolvedPath === '/labi'
                ? labiPage()
                : pages[resolvedPath] ?? pages['/'];
  const app = document.querySelector<HTMLDivElement>('#app');
  const profileLabel = currentUser ? 'Mans profils' : 'Ienākt profilā';
  const profileHref = currentUser ? '#/profils' : '#/autentifikacija';

  if (!app) {
    return;
  }

  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <header class="sticky top-0 z-10 border-b border-white/5 bg-slate-950/70 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <a
            class="text-xs uppercase tracking-[0.35em] text-slate-400 transition hover:text-slate-200"
            href="#/"
          >
            Laivu brauciens
          </a>
          <nav class="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <a class="transition hover:text-slate-50" href="#/dalibnieki">Dalībnieki</a>
            <a class="transition hover:text-slate-50" href="#/galerija">Galerija</a>
            <a class="transition hover:text-slate-50" href="#/apraksts">Apraksts</a>
            <a class="transition hover:text-slate-50" href="#/rezultati/pirmais">Rezultāti</a>
            <a
              class="rounded-full border border-slate-700/70 px-3 py-1.5 text-slate-100 transition hover:border-slate-500"
              href="${profileHref}"
            >
              ${profileLabel}
            </a>
            ${
              currentUser
                ? `<button
                    class="rounded-full border border-slate-700/70 px-3 py-1.5 text-slate-200 transition hover:border-slate-500"
                    id="logout-button"
                    type="button"
                  >
                    Iziet
                  </button>`
                : ''
            }
          </nav>
    </div>
      </header>
      <main class="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-16 px-6 py-16 sm:px-10">
        ${page}
      </main>
    </div>
  `;

  if (resolvedPath === '/autentifikacija') {
    if (authMode === 'login') {
      initGoogleSignIn();
    }
    initPasswordAuth();
  }
  if (resolvedPath === '/dalibnieki') {
    initParticipants();
    initParticipantsMotion();
  } else if (participantsAnimationId) {
    cancelAnimationFrame(participantsAnimationId);
    participantsAnimationId = null;
    if (participantsResizeHandler) {
      window.removeEventListener('resize', participantsResizeHandler);
      participantsResizeHandler = null;
    }
  }
  if (resolvedPath === '/') {
    initCountdown();
    initExperienceTicker();
  } else if (countdownInterval) {
    window.clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (resolvedPath !== '/' && experienceInterval) {
    window.clearInterval(experienceInterval);
    experienceInterval = null;
  }
  if (!resolvedPath.startsWith('/rezultati') && (resultsLoaded || resultsLoading)) {
    resultsLoaded = false;
    resultsLoading = false;
    resultsError = null;
  }
  const modalClosers = document.querySelectorAll<HTMLElement>('[data-modal-close]');
  modalClosers.forEach((closer) => {
    closer.addEventListener('click', () => {
      selectedParticipant = null;
      render();
    });
  });
  if (resolvedPath === '/profils') {
    initProfileForm();
  }
  if (resolvedPath === '/galerija') {
    initGallery();
  }
  if (resolvedPath.startsWith('/rezultati')) {
    initResults();
  }
  if (resolvedPath === '/labi') {
    initFirstTask();
  }

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      setCurrentUser(null);
      window.location.hash = '#/';
      window.location.reload();
    });
  }
};

window.addEventListener('hashchange', handleHashChange);
render();

function initPasswordAuth() {
  const submitButton = document.getElementById('auth-submit');
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const emailInput = document.getElementById('auth-email') as HTMLInputElement | null;
  const nameInput = document.getElementById('auth-name') as HTMLInputElement | null;
  const passwordInput = document.getElementById('auth-password') as HTMLInputElement | null;

  if (!submitButton || !emailInput || !passwordInput) {
    return;
  }

  const handleAuth = async (mode: 'login' | 'register') => {
    authError = null;
    authLoading = true;
    render();

    try {
      const payload =
        mode === 'register'
          ? {
              email: emailInput.value,
              name: nameInput?.value ?? '',
              password: passwordInput.value,
            }
          : {
              email: emailInput.value,
              password: passwordInput.value,
            };

      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Auth failed');
      }

      const data = (await response.json()) as { user: UserProfile };
      setCurrentUser(data.user);
      window.location.hash = '#/profils';
      window.location.reload();
    } catch (error) {
      authError = 'Neizdevās pieslēgties. Lūdzu, pārbaudi datus.';
    } finally {
      authLoading = false;
      render();
    }
  };

  submitButton.addEventListener('click', () => {
    handleAuth(authMode);
  });

  if (switchToRegister) {
    switchToRegister.addEventListener('click', () => {
      authMode = 'register';
      authError = null;
      render();
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', () => {
      authMode = 'login';
      authError = null;
      render();
    });
  }
}

function initProfileForm() {
  const user = currentUser;
  if (!user) {
    return;
  }

  const editButton = document.getElementById('profile-edit');
  if (editButton) {
    editButton.addEventListener('click', () => {
      profileMode = 'edit';
      profileError = null;
      render();
    });
  }

  if (profileMode !== 'edit') {
    return;
  }

  const uploadButton = document.getElementById('profile-upload');
  const fileInput = document.getElementById('profile-image') as HTMLInputElement | null;
  const saveButton = document.getElementById('profile-save');
  const cancelButton = document.getElementById('profile-cancel');
  const firstNameInput = document.getElementById('profile-first-name') as HTMLInputElement | null;
  const lastNameInput = document.getElementById('profile-last-name') as HTMLInputElement | null;
  const aboutInput = document.getElementById('profile-about') as HTMLTextAreaElement | null;
  const colorInput = document.getElementById('profile-color') as HTMLInputElement | null;
  const colorPresets = document.getElementById('color-presets');
  const nicknameInput = document.getElementById('profile-nickname') as HTMLInputElement | null;
  const favoriteFoodInput = document.getElementById('profile-favorite-food') as HTMLInputElement | null;
  const pastExperienceInput = document.getElementById('profile-experience') as HTMLInputElement | null;
  const yearInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[data-participation-year]'),
  );
  const showInput = document.getElementById('profile-show') as HTMLInputElement | null;

  if (
    !saveButton ||
    !cancelButton ||
    !firstNameInput ||
    !lastNameInput ||
    !aboutInput ||
    !colorInput ||
    !nicknameInput ||
    !favoriteFoodInput ||
    !pastExperienceInput ||
    !showInput
  ) {
    return;
  }

  cancelButton.addEventListener('click', () => {
    profileMode = 'view';
    profileError = null;
    render();
  });

  if (colorPresets && colorInput) {
    colorPresets.querySelectorAll<HTMLButtonElement>('button[data-color]').forEach((button) => {
      button.addEventListener('click', () => {
        const color = button.dataset.color;
        if (color) {
          colorInput.value = color;
        }
      });
    });
  }

  if (uploadButton && fileInput) {
    uploadButton.addEventListener('click', () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          profileUploading = true;
          profileError = null;
          render();

          const imageBase64 = reader.result as string;
          const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id, email: user.email, imageBase64 }),
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const data = (await response.json()) as { url: string | null; user?: UserProfile | null };
          if (data.user) {
            setCurrentUser(data.user);
          } else if (data.url) {
            setCurrentUser({
              ...user,
              picture: data.url,
            });
          }
        } catch (error) {
          profileError = 'Neizdevās augšupielādēt attēlu.';
        } finally {
          profileUploading = false;
          render();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  saveButton.addEventListener('click', async () => {
    profileLoading = true;
    profileError = null;
    render();

    try {
      const displayName = [firstNameInput.value.trim(), lastNameInput.value.trim()]
        .filter(Boolean)
        .join(' ');
      const participationYears = yearInputs
        .filter((input) => input.checked)
        .map((input) => Number(input.value));
      const payload = {
        userId: user.id,
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        about: aboutInput.value.trim(),
        favoriteColor: colorInput.value,
        nickname: nicknameInput.value.trim(),
        favoriteFood: favoriteFoodInput.value.trim(),
        participationYears,
        pastExperience: pastExperienceInput.value.trim(),
        showProfile: showInput.checked,
        picture: user.picture,
        name: displayName || user.name,
      };

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const data = (await response.json()) as { user: UserProfile | null };
      if (data.user) {
        setCurrentUser({
          ...data.user,
          name: displayName || data.user.name,
        });
        profileMode = 'view';
      }
    } catch (error) {
      profileError = 'Neizdevās saglabāt profilu.';
    } finally {
      profileLoading = false;
      render();
    }
  });
}

function initFirstTask() {
  if (!currentUser) {
    return;
  }

  const button = document.getElementById('first-task-button');
  if (button) {
    button.addEventListener('click', async () => {
      if (!currentUser || firstTaskLoading) {
        return;
      }
      const previousCompletedAt = currentUser.firstTaskCompletedAt ?? null;
      const optimisticCompletedAt = new Date().toISOString();
      firstTaskLoading = true;
      firstTaskError = null;
      setCurrentUser({
        ...currentUser,
        firstTaskCompletedAt: optimisticCompletedAt,
      });
      try {
        const response = await fetch(`${API_BASE_URL}/users/first-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        if (!response.ok) {
          throw new Error('First task failed');
        }
        const data = (await response.json()) as { firstTaskCompletedAt?: string | null };
        firstTaskLoading = false;
        setCurrentUser({
          ...currentUser,
          firstTaskCompletedAt: data.firstTaskCompletedAt ?? optimisticCompletedAt,
        });
      } catch (error) {
        firstTaskError = 'Neizdevās pabeigt uzdevumu. Lūdzu, mēģini vēlreiz.';
        firstTaskLoading = false;
        setCurrentUser({
          ...currentUser,
          firstTaskCompletedAt: previousCompletedAt ?? undefined,
        });
      }
    });
  }

  if (firstTaskChecking) {
    return;
  }

  firstTaskChecking = true;
  fetch(`${API_BASE_URL}/users/first-task?userId=${encodeURIComponent(currentUser.id)}`, {
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to load task status');
      }
      return (await response.json()) as { firstTaskCompletedAt?: string | null };
    })
    .then((data) => {
      firstTaskChecked = true;
      if (data.firstTaskCompletedAt) {
        setCurrentUser({
          ...currentUser,
          firstTaskCompletedAt: data.firstTaskCompletedAt,
        });
      } else if (currentUser.firstTaskCompletedAt) {
        setCurrentUser({
          ...currentUser,
          firstTaskCompletedAt: null,
        });
      }
    })
    .catch(() => {
      firstTaskChecked = true;
      firstTaskError = 'Neizdevās pārbaudīt uzdevumu.';
      render();
    })
    .finally(() => {
      firstTaskChecking = false;
    });
}

function initResults() {
  const tab = getResultsRoute();
  if (tab !== 'pirmais') {
    return;
  }
  if (resultsLoading || resultsLoaded) {
    return;
  }
  resultsLoading = true;
  resultsError = null;
  firstTaskResults = [];
  render();
  fetch(`${API_BASE_URL}/users/first-task-results`, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to load results');
      }
      return (await response.json()) as { users: TaskResult[] };
    })
    .then((data) => {
      firstTaskResults = data.users ?? [];
      resultsLoading = false;
      resultsLoaded = true;
      render();
    })
    .catch(() => {
      resultsLoading = false;
      resultsError = 'Neizdevās ielādēt rezultātus.';
      resultsLoaded = true;
      render();
    });
}

type PublicParticipant = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  favoriteFood?: string;
  about?: string;
  pastExperience?: string;
  favoriteColor?: string;
  participationYears?: number[];
  picture?: string;
};

var participants: PublicParticipant[] | null = null;
var participantsLoading = false;
var participantsError: string | null = null;
var participantsAnimationId: number | null = null;
var participantsResizeHandler: (() => void) | null = null;
var selectedParticipant: PublicParticipant | null = null;
var experienceInterval: number | null = null;
var experienceLines: string[] = [];
var lastExperience: string | null = null;
var galleryCounts: GallerySummary = {};
var galleryCountsLoading = false;
var galleryCovers: Record<number, string> = {};
var galleryCoversLoading = false;
var galleryViewYear: number | null = null;
var galleryPhotos: { url: string }[] = [];
var galleryPhotosLoading = false;
var galleryActiveIndex = 0;
var galleryUploadYear: number | null = null;
var galleryUploadOpen = false;
var galleryUploadError: string | null = null;
var galleryUploadLoading = false;
window.openGalleryUpload = (year: number) => {
  if (!Number.isNaN(year)) {
    galleryUploadYear = year;
  }
  galleryUploadOpen = true;
  galleryUploadError = null;
  render();
};

window.openGalleryView = (year: number) => {
  if (Number.isNaN(year)) {
    return;
  }
  galleryViewYear = year;
  galleryPhotosLoading = true;
  galleryPhotos = [];
  galleryActiveIndex = 0;
  render();
  fetch(`${API_BASE_URL}/photos?year=${year}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to load photos');
      }
      const data = (await response.json()) as { photos: { url: string }[] };
      galleryPhotos = data.photos;
    })
    .catch(() => {
      galleryPhotos = [];
    })
    .finally(() => {
      galleryPhotosLoading = false;
      render();
    });
};

window.closeGalleryUpload = () => {
  galleryUploadOpen = false;
  galleryUploadYear = null;
  galleryUploadError = null;
  render();
};

window.closeGalleryView = () => {
  galleryViewYear = null;
  galleryPhotos = [];
  galleryActiveIndex = 0;
  render();
};

window.submitGalleryUpload = () => {
  const fileInput = document.getElementById('gallery-file') as HTMLInputElement | null;
  if (!fileInput || !currentUser || !galleryUploadYear) {
    return;
  }
  const userId = currentUser.id;
  const year = galleryUploadYear;
  const files = Array.from(fileInput.files ?? []);
  if (!files.length) {
    galleryUploadError = 'Izvēlies attēlu.';
    render();
    return;
  }

  galleryUploadLoading = true;
  galleryUploadError = null;
  render();

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Read failed'));
      reader.readAsDataURL(file);
    });

  Promise.all(
    files.map(async (file) => {
      const imageBase64 = await readAsDataUrl(file);
      const response = await fetch(`${API_BASE_URL}/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          year,
          imageBase64,
        }),
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
    }),
  )
    .then(() => {
      galleryCounts = {};
      galleryCovers = {};
      galleryCoversLoading = false;
      galleryUploadOpen = false;
      galleryUploadYear = null;
      galleryUploadLoading = false;
      render();
    })
    .catch(() => {
      galleryUploadLoading = false;
      galleryUploadError = 'Neizdevās augšupielādēt attēlus.';
      render();
    });
};

window.galleryPrev = () => {
  if (galleryActiveIndex > 0) {
    galleryActiveIndex -= 1;
    render();
  }
};

window.galleryNext = () => {
  if (galleryActiveIndex < galleryPhotos.length - 1) {
    galleryActiveIndex += 1;
    render();
  }
};

window.gallerySetIndex = (index: number) => {
  if (index >= 0 && index < galleryPhotos.length) {
    galleryActiveIndex = index;
    render();
  }
};

function participantsPage() {
  return `
    <div class="participants-field">
      ${
        participantsLoading
          ? `<p class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-400">Ielādējam dalībniekus...</p>`
          : participantsError
            ? `<p class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-rose-300">${escapeHtml(participantsError)}</p>`
            : participants && participants.length
              ? participants
                  .map((participant) => {
                    const firstName = participant.firstName || '';
                  const displayName = participant.nickname
                    ? `${firstName} "${participant.nickname}" ${participant.lastName ?? ''}`.trim()
                    : `${firstName} ${participant.lastName ?? ''}`.trim() ||
                      participant.name ||
                      'Dalībnieks';
                    const picture = participant.picture ? escapeHtml(participant.picture) : '';
                    return `
      <article
        class="participant-bubble"
        style="--ring-color: ${escapeHtml(participant.favoriteColor ?? '#334155')}"
        data-participant-id="${escapeHtml(participant.id)}"
      >
          <div class="bubble-circle">
            ${
              picture
                ? `<img src="${picture}" alt="${escapeHtml(displayName)}" />`
                : `<div class="participant-fallback">Foto</div>`
            }
          </div>
        </article>
      `;
                  })
                  .join('')
              : `<p class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-400">Pagaidām nav publisku profilu.</p>`
      }
  </div>
  ${
    selectedParticipant
      ? `
    <div class="participant-modal" role="dialog" aria-modal="true">
      <div class="participant-modal__backdrop" data-modal-close></div>
      <div class="participant-modal__card" style="--ring-color: ${escapeHtml(selectedParticipant.favoriteColor ?? '#334155')}">
        <button class="participant-modal__close" type="button" data-modal-close aria-label="Aizvērt">
          ×
        </button>
        <div class="participant-modal__avatar">
          ${
            selectedParticipant.picture
              ? `<img src="${escapeHtml(selectedParticipant.picture)}" alt="${escapeHtml(selectedParticipant.name ?? 'Dalībnieks')}" />`
              : `<div class="participant-fallback">Foto</div>`
          }
        </div>
        <h3 class="participant-modal__name">
          ${escapeHtml(
            selectedParticipant.nickname
              ? `${selectedParticipant.firstName ?? ''} "${selectedParticipant.nickname}" ${selectedParticipant.lastName ?? ''}`.trim()
              : `${selectedParticipant.firstName ?? ''} ${selectedParticipant.lastName ?? ''}`.trim() ||
                selectedParticipant.name ||
                'Dalībnieks',
          )}
        </h3>
        ${
          selectedParticipant.participationYears?.length
            ? `<div class="participant-badge participant-badge--${Math.min(
                selectedParticipant.participationYears.length,
                5,
              )}">
                <span>${selectedParticipant.participationYears.length} gadi</span>
              </div>`
            : `<div class="participant-badge participant-badge--new">
                <span>Jauniņais</span>
              </div>`
        }
        <div class="participant-modal__meta">
          ${
            selectedParticipant.about
              ? `<span>${escapeHtml(selectedParticipant.about)}</span>`
              : ''
          }
        </div>
      </div>
  </div>
`
      : ''
  }
  `;
}

function galleryPage() {
  return `
    <section class="rounded-3xl border border-white/5 bg-white/5 p-8">
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${[2020, 2021, 2022, 2023, 2024, 2025]
          .map(
            (year) => `
          <article
            class="rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-center transition hover:border-white/30 hover:bg-slate-900/50 cursor-pointer"
            role="button"
            tabindex="0"
            onclick="window.openGalleryView(${year})"
            style="${
              (galleryCovers ?? {})[year]
                ? `background-image: linear-gradient(180deg, rgba(2, 6, 23, 0.65), rgba(2, 6, 23, 0.85)), url('${escapeHtml((galleryCovers ?? {})[year])}'); background-size: cover; background-position: center;`
                : ''
            }"
          >
            <h3 class="text-2xl font-light text-slate-100">${year}</h3>
            <p class="mt-4 text-sm text-slate-400">
              ${
                (() => {
                  const count = (galleryCounts ?? {})[year] ?? 0;
                  return count === 1 ? '1 bilde' : `${count} bildes`;
                })()
              }
            </p>
            <div class="mt-5 flex flex-wrap justify-center gap-3">
              ${
                currentUser
                  ? `
                <button
                  class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/30"
                  onclick="event.stopPropagation(); window.openGalleryUpload(${year})"
                  type="button"
                >
                  Pievienot bildes
                </button>
              `
                  : ''
              }
            </div>
          </article>
        `,
          )
          .join('')}
      </div>
      ${
        galleryUploadOpen && galleryUploadYear
          ? `
        <div class="participant-modal" role="dialog" aria-modal="true">
          <div class="participant-modal__backdrop" onclick="window.closeGalleryUpload()"></div>
          <div class="gallery-modal__card">
            <button class="participant-modal__close" type="button" onclick="window.closeGalleryUpload()" aria-label="Aizvērt">
              ×
            </button>
            <h3 class="participant-modal__name">Pievienot bildes ${galleryUploadYear}</h3>
            <div class="mt-6 grid gap-4">
              <input
                class="block text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-white"
                id="gallery-file"
                type="file"
                multiple
                accept="image/*"
              />
              ${
                galleryUploadError
                  ? `<p class="text-sm text-rose-300">${escapeHtml(galleryUploadError)}</p>`
                  : ''
              }
              <button
                class="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-white"
                id="gallery-upload"
                onclick="window.submitGalleryUpload()"
                type="button"
              >
                ${galleryUploadLoading ? 'Augšupielādējam...' : 'Augšupielādēt'}
              </button>
            </div>
          </div>
  </div>
`
          : ''
      }
      ${
        galleryViewYear
          ? `
        <div class="participant-modal" role="dialog" aria-modal="true">
          <div class="participant-modal__backdrop" onclick="window.closeGalleryView()"></div>
          <div class="gallery-modal__card">
            <button class="participant-modal__close" type="button" onclick="window.closeGalleryView()" aria-label="Aizvērt">
              ×
            </button>
            <h3 class="participant-modal__name">Galerija ${galleryViewYear}</h3>
            ${
              galleryPhotosLoading
                ? `<p class="mt-6 text-sm text-slate-400">Ielādējam bildes...</p>`
                : galleryPhotos.length
                  ? `
              <div class="mt-6 flex flex-col gap-6">
                <div class="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
                  <img
                    src="${escapeHtml(galleryPhotos[galleryActiveIndex]?.url ?? '')}"
                    class="max-h-[62vh] w-full object-contain lg:max-h-[68vh]"
                    alt="Galerijas bilde"
                  />
                </div>
                <div class="flex items-center justify-between text-sm text-slate-400">
                  <button
                    class="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-white/30 disabled:opacity-40 disabled:hover:border-white/10"
                    onclick="window.galleryPrev()"
                    ${galleryActiveIndex <= 0 ? 'disabled' : ''}
                    type="button"
                  >
                    Iepriekšējā
                  </button>
                  <span>${galleryActiveIndex + 1} / ${galleryPhotos.length}</span>
                  <button
                    class="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-white/30 disabled:opacity-40 disabled:hover:border-white/10"
                    onclick="window.galleryNext()"
                    ${galleryActiveIndex >= galleryPhotos.length - 1 ? 'disabled' : ''}
                    type="button"
                  >
                    Nākošā
                  </button>
                </div>
                <div class="flex gap-3 overflow-x-auto pb-2">
                  ${galleryPhotos
                    .map(
                      (photo, index) => `
                    <button
                      class="relative shrink-0 overflow-hidden rounded-2xl border ${index === galleryActiveIndex ? 'border-white/40' : 'border-white/10'}"
                      style="width: 96px; height: 72px"
                      onclick="window.gallerySetIndex(${index})"
                      type="button"
                    >
                      <img src="${escapeHtml(photo.url)}" class="h-full w-full object-cover" alt="Galerijas bilde" />
                    </button>
                  `,
                    )
                    .join('')}
                </div>
              </div>
              `
                  : `<p class="mt-6 text-sm text-slate-400">Nav pievienotu bilžu.</p>`
            }
          </div>
        </div>
      `
          : ''
      }
    </section>
  `;
}

function initExperienceTicker() {
  const experienceEl = document.getElementById('experience-text');
  if (!experienceEl) {
    return;
  }

  if (experienceInterval) {
    window.clearInterval(experienceInterval);
    experienceInterval = null;
  }

  const refreshExperiences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/public`);
      if (!response.ok) {
        throw new Error('Failed to load experiences');
      }
      const data = (await response.json()) as { users: PublicParticipant[] };
      experienceLines = data.users
        .map((user) => user.pastExperience?.trim())
        .filter((text): text is string => Boolean(text));
    } catch {
      experienceLines = [];
    }
  };

  const pickRandom = () => {
    if (experienceLines.length === 0) {
      experienceEl.textContent = '';
      return;
    }
    if (experienceLines.length === 1) {
      experienceEl.textContent = experienceLines[0];
      experienceEl.classList.remove('experience-fade-in', 'experience-fade-out');
      lastExperience = experienceLines[0];
      return;
    }
    let next = experienceLines[Math.floor(Math.random() * experienceLines.length)];
    if (lastExperience && experienceLines.length > 1) {
      let guard = 0;
      while (next === lastExperience && guard < 10) {
        next = experienceLines[Math.floor(Math.random() * experienceLines.length)];
        guard += 1;
      }
    }
    experienceEl.classList.remove('experience-fade-in');
    experienceEl.classList.add('experience-fade-out');
    window.setTimeout(() => {
      experienceEl.textContent = next;
      experienceEl.classList.remove('experience-fade-out');
      experienceEl.classList.add('experience-fade-in');
      lastExperience = next;
    }, 250);
  };

  refreshExperiences().then(() => {
    pickRandom();
    if (experienceLines.length > 1) {
      experienceInterval = window.setInterval(async () => {
        await refreshExperiences();
        pickRandom();
      }, 10000);
    }
  });
}

function initGallery() {
  if (!galleryCountsLoading && Object.keys(galleryCounts ?? {}).length === 0) {
    galleryCountsLoading = true;
    fetch(`${API_BASE_URL}/photos/summary`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load gallery');
        }
        const data = (await response.json()) as { summary: GallerySummary };
        galleryCounts = data.summary;
      })
      .catch(() => {
        galleryCounts = {};
      })
      .finally(() => {
        galleryCountsLoading = false;
        render();
      });
  }

  if (!galleryCoversLoading && Object.keys(galleryCovers ?? {}).length === 0) {
    galleryCoversLoading = true;
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const loadFallback = () =>
      Promise.all(
        years.map(async (year) => {
          const response = await fetch(`${API_BASE_URL}/photos?year=${year}`, {
            cache: 'no-store',
          });
          if (!response.ok) {
            return null;
          }
          const data = (await response.json()) as { photos: { url?: string }[] };
          return data.photos?.[0]?.url ? { year, url: data.photos[0].url } : null;
        }),
      ).then((results) => {
        const covers: Record<number, string> = {};
        results.forEach((result) => {
          if (result?.url) {
            covers[result.year] = result.url;
          }
        });
        galleryCovers = covers;
      });

    fetch(`${API_BASE_URL}/photos/covers`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load covers');
        }
        const data = (await response.json()) as { covers: Record<number, string> };
        galleryCovers = data.covers ?? {};
      })
      .catch(() => loadFallback())
      .finally(() => {
        galleryCoversLoading = false;
        render();
      });
  }
}

function initParticipants() {
  if (participantsLoading || participants) {
    return;
  }

  participantsLoading = true;
  participantsError = null;
  render();

  fetch(`${API_BASE_URL}/users/public`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to load participants');
      }
      const data = (await response.json()) as { users: PublicParticipant[] };
      participants = data.users;
    })
    .catch(() => {
      participantsError = 'Neizdevās ielādēt dalībniekus.';
    })
    .finally(() => {
      participantsLoading = false;
      render();
    });
}

function initParticipantsMotion() {
  const container = document.querySelector<HTMLElement>('.participants-field');
  if (!container || !participants || participants.length === 0) {
    return;
  }

  if (participantsAnimationId) {
    cancelAnimationFrame(participantsAnimationId);
    participantsAnimationId = null;
  }

  if (participantsResizeHandler) {
    window.removeEventListener('resize', participantsResizeHandler);
    participantsResizeHandler = null;
  }

  const bubbles = Array.from(container.querySelectorAll<HTMLElement>('.participant-bubble'));
  if (bubbles.length === 0) {
    return;
  }

  let bounds = container.getBoundingClientRect();
  const state = bubbles.map((bubble) => {
    const size = Math.max(bubble.offsetWidth, bubble.offsetHeight);
    const x = Math.random() * Math.max(1, bounds.width - size);
    const y = Math.random() * Math.max(1, bounds.height - size);
    const speed = 80 + Math.random() * 80;
    const angle = Math.random() * Math.PI * 2;
    const item = {
      bubble,
      size,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      hovered: false,
    };
    bubble.addEventListener('mouseenter', () => {
      item.hovered = true;
    });
    bubble.addEventListener('mouseleave', () => {
      item.hovered = false;
    });
    return item;
  });

  bubbles.forEach((bubble) => {
    bubble.addEventListener('click', () => {
      const id = bubble.dataset.participantId;
      if (!id || !participants) {
        return;
      }
      selectedParticipant = participants.find((participant) => participant.id === id) ?? null;
      render();
    });
  });

  const resolveCollision = (a: typeof state[0], b: typeof state[0]) => {
    const ax = a.x + a.size / 2;
    const ay = a.y + a.size / 2;
    const bx = b.x + b.size / 2;
    const by = b.y + b.size / 2;
    const dx = ax - bx;
    const dy = ay - by;
    const distance = Math.hypot(dx, dy);
    const minDist = a.size / 2 + b.size / 2;

    if (distance > 0 && distance < minDist) {
      const overlap = (minDist - distance) / 2;
      const nx = dx / distance;
      const ny = dy / distance;
      if (a.hovered && b.hovered) {
        return;
      }

      if (a.hovered) {
        b.x -= nx * overlap * 2;
        b.y -= ny * overlap * 2;
        b.vx *= -1;
        b.vy *= -1;
        return;
      }

      if (b.hovered) {
        a.x += nx * overlap * 2;
        a.y += ny * overlap * 2;
        a.vx *= -1;
        a.vy *= -1;
        return;
      }

      a.x += nx * overlap;
      a.y += ny * overlap;
      b.x -= nx * overlap;
      b.y -= ny * overlap;

      const tempVx = a.vx;
      const tempVy = a.vy;
      a.vx = b.vx;
      a.vy = b.vy;
      b.vx = tempVx;
      b.vy = tempVy;
    }
  };

  let lastTime = performance.now();
  const tick = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    state.forEach((item) => {
      if (item.hovered) {
        return;
      }
      item.x += item.vx * dt;
      item.y += item.vy * dt;

      if (item.x <= 0) {
        item.x = 0;
        item.vx *= -1;
      }
      if (item.y <= 0) {
        item.y = 0;
        item.vy *= -1;
      }
      if (item.x + item.size >= bounds.width) {
        item.x = bounds.width - item.size;
        item.vx *= -1;
      }
      if (item.y + item.size >= bounds.height) {
        item.y = bounds.height - item.size;
        item.vy *= -1;
      }
    });

    for (let i = 0; i < state.length; i += 1) {
      for (let j = i + 1; j < state.length; j += 1) {
        resolveCollision(state[i], state[j]);
      }
    }

    state.forEach((item) => {
      item.bubble.style.transform = `translate(${item.x}px, ${item.y}px)`;
    });

    participantsAnimationId = requestAnimationFrame(tick);
  };

  participantsResizeHandler = () => {
    bounds = container.getBoundingClientRect();
  };
  window.addEventListener('resize', participantsResizeHandler);
  participantsAnimationId = requestAnimationFrame(tick);
}

var countdownInterval: number | null = null;

function initCountdown() {
  const daysEl = document.getElementById('countdown-days');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return;
  }

  if (countdownInterval) {
    window.clearInterval(countdownInterval);
    countdownInterval = null;
  }

  const target = new Date(2026, 6, 4, 8, 0, 0);

  const update = () => {
    const now = new Date();
    const diff = Math.max(0, target.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  };

  update();
  countdownInterval = window.setInterval(update, 1000);
}
