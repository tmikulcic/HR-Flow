# HR-Flow

HR-Flow je web aplikacija za centralizirano upravljanje osnovnim HR procesima unutar kompanije. Povezuje administratore, HR djelatnike, managere i zaposlenike u zajedničkom workspaceu za upravljanje zaposlenicima, radnim vremenom, dopustima, timovima i obavijestima.

Objavljena aplikacija dostupna je na [hr-flow-pi.netlify.app](https://hr-flow-pi.netlify.app).

## Pregled aplikacije

- dashboard prilagođen korisničkoj ulozi;
- imenik i detaljni profili zaposlenika;
- dodavanje i uređivanje zaposlenika;
- tjedna evidencija i uređivanje radnog vremena;
- slanje i povlačenje zahtjeva za dopust;
- managersko odobravanje i odbijanje dopusta;
- pregled managerskog tima, dostupnosti i evidentiranih sati;
- centar obavijesti s pročitanim i nepročitanim statusom;
- administratorsko upravljanje korisnicima, ulogama i pristupom;
- upravljanje timovima i postavkama kompanije;
- responsive sučelje za desktop i mobilne uređaje.

## Korisničke uloge

| Uloga | Glavne mogućnosti |
| --- | --- |
| Administrator | Upravlja korisnicima, pristupom, timovima, kompanijom i zaposlenicima. |
| HR | Upravlja zaposlenicima i njihovom evidencijom unutar kompanije. |
| Manager | Pregledava vlastiti tim i odlučuje o zahtjevima za dopust. |
| Employee | Upravlja vlastitim radnim vremenom, dopustima i obavijestima. |

## Lokalno pokretanje

1. Instalirati ovisnosti:

   ```bash
   npm install
   ```

2. Smjestiti dobivenu `.env.local` datoteku u root direktorij projekta.

3. Pokrenuti razvojni server:

   ```bash
   npm run dev
   ```

4. Otvoriti lokalnu adresu koju prikaže Vite.

## Dokumentacija

Detaljna projektna i korisnička dokumentacija dostupna je u datoteci [docs/Dokumentacija.md](docs/Dokumentacija.md).

Dijagrami i prototip sučelja nalaze se u direktoriju [`docs`](docs/).
