# ADS CATCHER

**ZŁAP. ZDOBĄDŹ. POBIJ REKORD.**

Mała gra arcade dla **znajdzreklame.pl** — Billboardy • Citylighty • Wielki Format • Oklejanie autobusów.

Sterujesz samochodem dostawczym z billboardem na dachu. Z góry spadają reklamy — łap je, unikaj przeszkód, buduj combo i pobij rekord na tablicy TOP 10.

## Uruchomienie

Gra to trzy statyczne pliki — nie wymaga budowania ani zależności.

- Otwórz `index.html` w przeglądarce **lub**
- wystaw katalog przez dowolny serwer statyczny, np.:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Działa w każdej nowoczesnej przeglądarce (Chrome, Edge, Firefox, Safari). Na telefonie gra jest **w poziomie**: obróć urządzenie, a po bokach pojawią się strzałki lewo/prawo.

## Sterowanie

| Klawisz / gest | Akcja |
|---|---|
| `←` `→` (lub `A` `D`) | jazda w lewo / w prawo |
| strzałki po bokach (telefon) | jazda w lewo / w prawo (przytrzymaj) |
| lewa / prawa połowa ekranu | to samo na tablecie i ekranie dotykowym |
| dowolny klawisz | start gry |
| `Enter` / `Spacja` | szybki restart po przegranej |
| `M` | wyłącz / włącz dźwięk i muzykę |
| `P` (tylko debug) | zrzuca spadającą głowę Pawła |
| `R` (tylko debug) | zrzuca spadającą ruletkę |
| `Z` (tylko debug) | zrzuca spadający talerz żurku |
| `B` (tylko debug) | zrzuca miniboard w złym miejscu |
Tryb debug (admin): `?debug=1` w adresie. Wtedy widać ustawienia, katalog assetów i klawisze P/R/Z/B/T. Wyłączenie: `?debug=0`.

## Zasady

- **Łap** reklamy: plakaty, super umowę, produkty, citylighty, billboardy, billboard 12 m (5,04×2,38, jedna noda, bez oświetlenia), wielki format, nowego dostawcę, +500 pkt, nowe billboardy w bazie.
- **Unikaj** przeszkód (czerwona przerywana ramka): uszkodzone reklamy, odklejający się plakat, niedziałające oświetlenie, faktury, trudnych klientów, zniszczony wielki format, zepsuty żurek, miniboard w złym miejscu, brak raportów w terminie.
- Masz **3 życia**. Tracisz życie, gdy złapiesz przeszkodę albo przepuścisz reklamę (bonusy specjalne można bezkarnie przepuścić).
- Kolejne złapane reklamy bez pomyłki budują **COMBO** — mnożnik punktów (do x10).
- Tempo, liczba elementów i udział przeszkód rosną z czasem; po ~30 s gra jest już bardzo dynamiczna. Typowa rozgrywka trwa 30–60 s.

### Punktacja

| Element | Punkty |
|---|---|
| zwykła reklama (plakat, produkt) | +100 |
| **SUPER UMOWA** (podpisany kontrakt) | +350 |
| citylight | +150 |
| billboard | +200 |
| **BILLBOARD 12 M** (5,04×2,38, jedna noda, bez oświetlenia) | +180 |
| wielki format | +300 |
| **NOWY DOSTAWCA** | +280 |
| **+500 PKT** | +500 |
| **NOWE BILLBOARDY W BAZIE** | +400 |
| **BILLBOARD POWER** (billboard znajdzreklame.pl) | +1000 i **2x punkty** przez 6 s |
| **CITYLIGHT BONUS** (świecący citylight) | +150 i **2x punkty** przez 6 s |
| **WIELKI FORMAT** (ogromna plansza, szybka i chwiejna) | +2000 |
| **AUTOBUS** (przejeżdża przez ekran) | **MEGA BONUS +5000 — „OKLEJONY!”** |
| **ŻUREK** (zepsuty talerz) | overlay **„Nieświeży żurek”**, rój much po całym ekranie (jeszcze **5 s** po zniknięciu) i **−10 000 pkt** |
| **MINIBOARD W INNYM MIEJSCU** | overlay **„Miniboard w innym miejscu / Przypał u klienta”** i **−10 000 pkt** |
| **BRAK RAPORTÓW W TERMINIE** | overlay **„Brak raportów w terminie / Klient wydzwania wkurzony”** i **−5 000 pkt** |

### Power-upy (niebieskie, spadają od ~6 s gry)

| Power-up | Efekt |
|---|---|
| **SERCE** | +1 życie (max 5) |
| **SPOWOLNIENIE** | Wolniejsze opadanie reklam (8 s) |
| **SUPER ZASIĘG** | Szersza strefa łapania (8 s) |
| **MINI AUTO** | Mniejszy pojazd — łatwiejszy manewr (8 s) |
| **GŁOWA PAWŁA** | Zatrzymuje grę na chwilę, Paweł wlatuje na ekran i **podwyższa cele** — tempo +20% przez 7 s |
| **RULETKA** | Zatrzymuje grę — klasyczne koło z kulką. Pola: **+2 życia**, **+1 życie**, **−1 życie**, **modyfikator** albo **punkty +/−**. Na czas losowania gra muzyka kasyna. |

Punkty za zwykłe reklamy mnożone są przez combo i bonus 2x. Power-upów można nie złapać — bez kary.

## Tablica wyników

TOP 10 jest zapisywany w **Xano** (backend w folderze `xano/`). Gra ładuje ranking przez API i po wpisaniu imienia wysyła wynik na serwer. **Każda rozgrywka trafia do tabeli** `leaderboard_score` (pełna historia), a na publicznej tablicy widać **tylko najwyższy wynik danego imienia**. Przy braku sieci używa kopii z `localStorage`; gdy ranking jest pusty, tablica pozostaje pusta (bez przykładowych wyników).

Przy zapisie wyniku backend dostaje też identyfikatory przeglądarki (niewidoczne na publicznej tablicy — widać je w tabeli Xano `leaderboard_score`):

| Pole | Co to jest |
|---|---|
| `visitor_id` | stały UUID w `localStorage` (`bbcatch.vid.v1`) — ten sam, nawet gdy nick się zmieni |
| `fingerprint` | hash cech przeglądarki / urządzenia (UA, ekran, strefa, canvas, WebGL) |
| `ip` | IP z momentu zapisu |
| `user_agent` | nagłówek User-Agent |

Te same `visitor_id` / `fingerprint` / `ip` przy różnych nickach = prawie na pewno ta sama osoba.

- API: `https://xeow-pqh4-ha4j.f2.xano.io/api:gra-ads-catcher:v1/leaderboard`
- Klient w grze: `lib/xano-leaderboard.js`

Wyczyść lokalny cache tablicy w konsoli:

```js
localStorage.removeItem('bbcatch.board.v1');
```

## Ustawienia gry

Presety i suwaki trudności są trzymane w **Xano** (tabela `settings`, jeden wspólny rekord). Gra ładuje je przy starcie. **Zmiana ustawień jest tylko dla admina** — włącz tryb debug (`?debug=1`). Gracze bez debuga nie widzą zakładki ani przycisku „Ustawienia”. Przy braku sieci gra używa kopii z `localStorage` (`bbcatch.settings.v1`) albo presetu Normalny.

- API: `https://xeow-pqh4-ha4j.f2.xano.io/api:gra-ads-catcher:v1/settings`
- Klient: `lib/game-settings.js` + `lib/xano-leaderboard.js`

Wyczyść lokalny cache ustawień w konsoli:

```js
localStorage.removeItem('bbcatch.settings.v1');
```

## Katalog assetów

**`/assets/`** — podstrona z podglądem wszystkich **31 spadających elementów** (w tym 6 power-upów) (nazwa, ID, opis, rozmiar, punkty). Lista **wyłączonych** assetów jest wspólna i zapisuje się w Xano (pole `disabled_assets` w tabeli `settings`). Wyłączone pozycje nie pojawiają się podczas rozgrywki u żadnego gracza.

Edycja (przełącznik **W grze / Wyłączone**) działa tylko w trybie debug (`?debug=1`). Bez debuga katalog jest tylko do odczytu, a link w stopce gry jest ukryty.

Link w stopce gry (tylko debug): „Katalog assetów”.

## Dostosowanie

Wszystkie parametry balansu są w `game.js` i `lib/falling-items.js`:

- `ITEMS` — rodzaje elementów, punkty, rozmiary, wagi losowania, od której sekundy się pojawiają (`minT`);
- `diff` — krzywe trudności (prędkość, częstość spawnów, udział przeszkód, spawny „parami”);
- `startLives` / `maxLives` w `lib/game-settings.js` (`toConfig`) — startowe życia (5) i limit (`0` = bez limitu);
- `DOUBLE_DURATION` — długość bonusu 2x;
- kolory marki w `style.css` (`--brand`, `--brand-2`).

## Pliki

```
index.html              – struktura, ekran startowy, ustawienia, ekran końca gry i tablica TOP 10
style.css               – wygląd interfejsu (skalowanie do dużego ekranu / TV)
game.js                 – cała logika gry, grafika (Canvas 2D) i dźwięk (WebAudio)
lib/game-settings.js    – presety, suwaki, wyłączone assety i zapis w Xano
lib/xano-leaderboard.js – klient API (TOP 10 i ustawienia)
xano/                   – backend Xano (tabele, endpointy)
```
