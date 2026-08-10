# HR-Flow

HR-Flow je web aplikacija za centralizirano upravljanje osnovnim HR procesima unutar kompanije. Aplikacija povezuje administratore, HR djelatnike, managere i zaposlenike u zajedničkom workspaceu za evidenciju zaposlenika, radnog vremena, dopusta i obavijesti.

## Pregled aplikacije

- dashboard prilagođen korisničkoj ulozi;
- pregled i upravljanje zaposlenicima;
- tjedna evidencija radnog vremena;
- slanje i povlačenje zahtjeva za dopust;
- managersko odobravanje i odbijanje dopusta;
- pregled managerskog tima i dostupnosti;
- centar obavijesti s unread statusom;
- administratorsko upravljanje korisnicima, ulogama, timovima i kompanijom.

## Korisničke uloge

| Uloga | Glavne mogućnosti |
| --- | --- |
| Administrator | Upravljanje korisnicima, ulogama, timovima, kompanijom i zaposlenicima. |
| HR | Upravljanje zaposlenicima i pregled podataka kompanije. |
| Manager | Pregled vlastitog tima i odlučivanje o zahtjevima za dopust. |
| Employee | Upravljanje vlastitim radnim vremenom, dopustima i obavijestima. |

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
