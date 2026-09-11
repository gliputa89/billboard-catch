# BILLBOARD CATCH

**ZŁAP. ZDOBĄDŹ. POBIJ REKORD.**

Mała gra arcade dla **znajdzreklame.pl** — Billboardy • Citylighty • Wielki Format • Oklejanie autobusów.

Sterujesz samochodem dostawczym z billboardem na dachu. Z góry spadają reklamy — łap je, unikaj śmieci i przeszkód, buduj combo i pobij rekord na tablicy TOP 10.

## Uruchomienie

Gra to trzy statyczne pliki — nie wymaga budowania ani zależności.

- Otwórz `index.html` w przeglądarce **lub**
- wystaw katalog przez dowolny serwer statyczny, np.:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Działa w każdej nowoczesnej przeglądarce (Chrome, Edge, Firefox, Safari). Na ekranie dotykowym: dotknij lewej/prawej połowy ekranu.

## Sterowanie

| Klawisz | Akcja |
|---|---|
| `←` `→` (lub `A` `D`) | jazda w lewo / w prawo |
| dowolny klawisz | start gry |
| `Enter` / `Spacja` | szybki restart po przegranej |
| `M` | wyłącz / włącz dźwięk i muzykę |

Podczas rozgrywki gra odtwarza oryginalny loop **synthwave / retro arcade** (104 BPM — arpeggio, pad, beat 808) inspirowany klimatem *Midnight City*. Muzyka startuje po rozpoczęciu gry i cichnie po „KONIEC!”.

## Zasady

- **Łap** reklamy: plakaty, logo, litery, QR kody, megafony, produkty, citylighty, billboardy, wielki format.
- **Unikaj** przeszkód (czerwona przerywana ramka): śmieci, puste kartony, stare plakaty, znaki STOP, pachołki, elementy konstrukcyjne, uszkodzone reklamy, opony.
- Masz **3 życia**. Tracisz życie, gdy złapiesz przeszkodę albo przepuścisz reklamę (bonusy specjalne można bezkarnie przepuścić).
- Kolejne złapane reklamy bez pomyłki budują **COMBO** — mnożnik punktów (do x10).
- Tempo, liczba elementów i udział przeszkód rosną z czasem; po ~30 s gra jest już bardzo dynamiczna. Typowa rozgrywka trwa 30–60 s.

### Punktacja

| Element | Punkty |
|---|---|
| zwykła reklama (plakat, logo, litera, QR, megafon, produkt) | +100 |
| citylight | +150 |
| billboard | +200 |
| wielki format | +300 |
| **BILLBOARD POWER** (billboard znajdzreklame.pl) | +1000 i **2x punkty** przez 6 s |
| **CITYLIGHT BONUS** (świecący citylight) | +150 i **2x punkty** przez 6 s |
| **WIELKI FORMAT** (ogromna plansza, szybka i chwiejna) | +2000 |
| **AUTOBUS** (przejeżdża przez ekran) | **MEGA BONUS +5000 — „OKLEJONY!”** |

### Power-upy (niebieskie, spadają od ~6 s gry)

| Power-up | Efekt |
|---|---|
| **SERCE** | +1 życie (max 5) |
| **SPOWOLNIENIE** | Wolniejsze opadanie reklam (8 s) |
| **SUPER ZASIĘG** | Szersza strefa łapania (8 s) |
| **MINI AUTO** | Mniejszy pojazd — łatwiejszy manewr (8 s) |
| **PRECYZJA** | Wolniejszy pojazd — lepsza kontrola (8 s) |

Punkty za zwykłe reklamy mnożone są przez combo i bonus 2x. Power-upów można nie złapać — bez kary.

## Tablica wyników

TOP 10 zapisywane jest w `localStorage` przeglądarki (na jednym komputerze/kiosku wszyscy współdzielą jedną tablicę). Po grze kwalifikującej się do TOP 10 gracz wpisuje imię. Domyślne wpisy startowe (KAMIL, ANIA, TOMEK, MICHAŁ, KASIA) można zmienić w `game.js` w stałej `DEFAULT_BOARD`.

Aby wyczyścić tablicę i rekord, w konsoli przeglądarki:

```js
localStorage.removeItem('bbcatch.board.v1');
localStorage.removeItem('bbcatch.best.v1');
```

## Katalog assetów

**`/assets/`** — podstrona z podglądem wszystkich **26 spadających elementów** (w tym 5 power-upów) (nazwa, ID, opis, rozmiar, punkty). Przełącznik **W grze / Wyłączone** zapisuje wybór w `localStorage` (`bbcatch.disabled.v1`) — wyłączone assety nie pojawiają się podczas rozgrywki.

Link też w stopce gry: „Katalog assetów”.

## Dostosowanie

Wszystkie parametry balansu są w `game.js` i `lib/falling-items.js`:

- `ITEMS` — rodzaje elementów, punkty, rozmiary, wagi losowania, od której sekundy się pojawiają (`minT`);
- `diff` — krzywe trudności (prędkość, częstość spawnów, udział przeszkód, spawny „parami”);
- `START_LIVES`, `DOUBLE_DURATION` — liczba żyć i długość bonusu 2x;
- kolory marki w `style.css` (`--brand`, `--brand-2`).

## Pliki

```
index.html   – struktura, ekran startowy, ekran końca gry i tablica TOP 10
style.css    – wygląd interfejsu (skalowanie do dużego ekranu / TV)
game.js      – cała logika gry, grafika (Canvas 2D) i dźwięk (WebAudio)
```
