# HR-Flow

HR-Flow je web aplikacija za centralizirano upravljanje osnovnim HR procesima unutar kompanije. Aplikacija povezuje administratore, HR djelatnike, managere i zaposlenike u zajedničkom workspaceu za evidenciju zaposlenika, radnog vremena, dopusta i obavijesti.

Projekt je izrađen kao fakultetski MVP. Podržava podatkovno odvajanje više kompanija, dok početni skup podataka konfigurira jednu demonstracijsku kompaniju.

## Funkcionalnosti

- dashboard prilagođen korisničkoj ulozi;
- pregled i upravljanje zaposlenicima;
- tjedna evidencija radnog vremena;
- slanje i povlačenje zahtjeva za dopust;
- managersko odobravanje i odbijanje dopusta;
- pregled managerskog tima i dostupnosti;
- centar obavijesti s unread statusom;
- administratorsko upravljanje korisnicima, ulogama, timovima i kompanijom;
- Firebase Authentication prijava i reset lozinke;
- Cloud Firestore spremanje podataka i Security Rules autorizacija.

## Korisničke uloge

| Uloga | Glavne mogućnosti |
| --- | --- |
| Administrator | Upravljanje korisnicima, ulogama, timovima, kompanijom i zaposlenicima. |
| HR | Upravljanje zaposlenicima i pregled podataka kompanije. |
| Manager | Pregled vlastitog tima i odlučivanje o zahtjevima za dopust. |
| Employee | Upravljanje vlastitim radnim vremenom, dopustima i obavijestima. |

## Tehnologije

- Vue.js 3
- Vue Router
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore

## Preduvjeti

- Node.js 22 ili 24 LTS
- npm
- Firebase projekt s registriranom Web aplikacijom
- uključen Email/Password provider u Firebase Authenticationu
- kreirana Cloud Firestore baza

## Lokalno pokretanje

1. Instalirati ovisnosti:

   ```bash
   npm install
   ```

2. Kopirati primjer environment konfiguracije:

   ```bash
   cp .env.example .env.local
   ```

3. U `.env.local` unijeti konfiguraciju Firebase Web aplikacije:

   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

4. Pokrenuti razvojni server:

   ```bash
   npm run dev
   ```

5. Otvoriti lokalnu adresu koju prikaže Vite.

Stvarna `.env.local` datoteka ignorirana je u Gitu. Firebase Web konfiguracija ne daje administratorski pristup projektu; pristup podacima kontroliraju Firebase Authentication i Firestore Security Rules.

## Početni Firestore podaci

Početni skup u `src/data/seed.js` sadrži jednu kompaniju, korisnike, zaposlenike, timove, evidencije vremena, dopuste i obavijesti. Kod inicijalnog postavljanja prazne baze potrebno je:

1. privremeno koristiti Firestore Test mode;
2. u Firebase Authenticationu napraviti korisnike čiji email odgovara seed user zapisima;
3. pokrenuti aplikaciju i prijaviti se jednim od tih računa;
4. nakon kreiranja početnih podataka deployati pravila iz `firestore.rules`.

Podaci za demonstracijske račune nisu zapisani u javnom repozitoriju.

## Firestore struktura

| Kolekcija | Sadržaj |
| --- | --- |
| `companies` | Osnovni podaci i vremenska zona kompanije. |
| `memberships` | Veza Firebase računa s aplikacijskim korisnikom i kompanijom. |
| `users` | Uloge, status pristupa i veza sa zaposlenikom. |
| `employees` | Osobni i organizacijski podaci zaposlenika. |
| `teams` | Timovi i pripadajući manageri. |
| `timeEntries` | Dnevne evidencije radnog vremena. |
| `leaveRequests` | Zahtjevi za dopust i managerske odluke. |
| `notifications` | Korisničke obavijesti i unread status. |

Podaci se pri prijavi učitavaju prema kompaniji i ulozi. Komponente ne pozivaju Firebase izravno, nego koriste servisni i repository sloj.

Zapisi radnog vremena i zahtjevi za dopust uz `employeeId` sadrže i `managerId`. To omogućuje da managerski Firestore query dohvaća samo zapise članova njegova tima bez učitavanja podataka cijele kompanije.

## Firestore pravila i indeksi

Repozitorij sadrži:

- `firebase.json` – Firebase CLI konfiguraciju;
- `.firebaserc` – zadani Firebase projekt;
- `firestore.rules` – autentifikaciju, izolaciju kompanija i role-based pristup;
- `firestore.indexes.json` – indekse potrebne za scoped queryje.

Za deploy Firestore konfiguracije:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore
```

## Dostupne naredbe

```bash
npm run dev      # razvojni server
npm run build    # production build
npm run preview  # lokalni pregled production builda
```

## Struktura source direktorija

```text
src/
├── components/    višekratno korištene UI komponente
├── data/          početni seed podaci
├── domain/        domenski modeli, konstante i dozvole
├── layouts/       zajednički aplikacijski layout
├── pages/         Vue stranice povezane s routerom
├── repositories/  Firestore pristup i lokalni cache
├── services/      poslovna logika aplikacije
└── stores/        Firebase session state
```

## Sigurnost

- sve zaštićene operacije zahtijevaju Firebase Authentication;
- membership povezuje autentificirani račun s jednom kompanijom;
- svaki Firestore dokument provjerava pripadnost kompaniji;
- uloga određuje dopuštene read i write operacije;
- nepoznate kolekcije su zadano zabranjene;
- Service Account ključevi i privatni Firebase credentials ne smiju se spremati u repozitorij.
