# Crypto Price Tracker

Eine einfache statische Web-App zum Anzeigen aktueller Krypto-Preise und historischer Preisverlaeufe fuer Bitcoin, Monero, Litecoin und Solana.

Die App besteht nur aus HTML, CSS und JavaScript. Es gibt keinen Build-Prozess, keine Paketverwaltung und kein Backend. Alle Daten werden im Browser ueber die oeffentliche CoinGecko API geladen.

## Features

- Aktuelle Preise fuer:
  - Bitcoin (BTC)
  - Monero (XMR)
  - Litecoin (LTC)
  - Solana (SOL)
- Anzeige der 24h-Preisveraenderung
- Auswahl der Preisquelle:
  - CoinGecko
  - CoinPaprika
  - CoinLore
- Dark Mode mit gespeicherter Einstellung
- Optionales Auto-Update fuer aktuelle Preise
- Klickbare Coin-Karten
- Historien-Graph fuer die ausgewaehlte Kryptowaehrung
- Zeitraum-Auswahl:
  - 1D
  - 3D
  - 1W
  - 1M
  - 1J
  - All Time
- Statistik unter dem Graphen:
  - Startpreis
  - aktueller Preis
  - Hoechstpreis
  - Tiefstpreis
- Responsive Layout fuer Desktop und Smartphone
- Keine externen JavaScript-Bibliotheken
- Lokale Coin-Logos fuer Spenden-Wallets

## Projektstruktur

```text
crypto-tracker/
├── assets/
│   └── icons/
│       ├── btc.svg
│       ├── ltc.svg
│       ├── sol.svg
│       └── xmr.svg
├── index.html
├── styles.css
├── script.js
├── LICENSE
└── README.md
```

## Verwendete API

Die App nutzt die oeffentliche CoinGecko API.

Alternativ koennen aktuelle Preise ueber das Dropdown auch von CoinPaprika oder CoinLore geladen werden.

Aktuelle Preise:

```text
https://api.coingecko.com/api/v3/simple/price
https://api.coinpaprika.com/v1/tickers/{coin-id}?quotes=EUR
https://api.coinlore.net/api/ticker/?id={coin-ids}
```

Historische Preise:

```text
https://api.coingecko.com/api/v3/coins/{coin-id}/market_chart
```

Verwendete CoinGecko IDs:

| Waehrung | Symbol | CoinGecko ID |
| --- | --- | --- |
| Bitcoin | BTC | `bitcoin` |
| Monero | XMR | `monero` |
| Litecoin | LTC | `litecoin` |
| Solana | SOL | `solana` |

## Bildquellen

Die Coin-Logos in `assets/icons/` stammen aus dem Projekt `cryptocurrency-icons`.

Das Projekt steht unter `CC0-1.0`, die Icons sind damit frei nutzbar.

## App starten

Da es sich um eine statische Web-App handelt, reicht ein einfacher lokaler Webserver.

Im Projektordner ausfuehren:

```bash
python3 -m http.server 8001
```

Danach im Browser oeffnen:

```text
http://127.0.0.1:8001/
```

Falls Port `8001` belegt ist, kann ein anderer Port verwendet werden:

```bash
python3 -m http.server 8080
```

Dann entsprechend oeffnen:

```text
http://127.0.0.1:8080/
```

## Nutzung

1. Die App laedt beim Start automatisch die aktuellen Preise.
2. Ueber das Dropdown `Quelle` kann zwischen CoinGecko, CoinPaprika und CoinLore gewechselt werden.
3. Mit dem Button `Dark Mode` kann zwischen hellem und dunklem Theme gewechselt werden.
4. Mit dem Button `Auto Update` kann eine automatische Aktualisierung aktiviert werden.
5. Mit dem Button `Aktualisieren` werden die aktuellen Preise sofort neu geladen.
6. Durch Klick auf eine Coin-Karte wird unten der Historien-Graph geladen.
7. Mit den Zeitraum-Buttons kann zwischen `1D`, `3D`, `1W`, `1M`, `1J` und `All Time` gewechselt werden.

## Technische Details

### `index.html`

Enthaelt die Grundstruktur der App:

- Header
- Aktualisieren-Button
- Coin-Karten
- Chart-Bereich
- Statistik-Bereich

### `styles.css`

Enthaelt das komplette Styling:

- responsives Grid
- klickbare Coin-Karten
- Chart-Panel
- Zeitraum-Buttons
- mobile Anpassungen

### `script.js`

Enthaelt die komplette App-Logik:

- Laden aktueller Preise
- Wechsel zwischen mehreren kostenlosen Preisquellen
- Konservatives Auto-Update alle 5 Minuten
- Laden historischer Preise
- Caching bereits geladener Historien-Daten
- Zeichnen des Graphen mit Canvas
- Aktualisieren der Statistikwerte
- Wechsel zwischen Coins und Zeitraeumen

## Hinweise

- Die CoinGecko API kann Rate Limits haben. Wenn zu viele Anfragen in kurzer Zeit gestellt werden, kann das Laden kurzzeitig fehlschlagen.
- Das Auto-Update nutzt ein konservatives Intervall von 5 Minuten und pausiert, wenn der Browser-Tab im Hintergrund ist.
- Nach einem Ladefehler wartet das Auto-Update 10 Minuten bis zum naechsten Versuch.
- Auto-Update aktualisiert nur die aktuellen Preise, nicht die Historien-Charts.
- Die App nutzt Euro (`EUR`) als Preiswaehrung.
- CoinGecko und CoinPaprika liefern die aktuellen Preise in Euro (`EUR`).
- CoinLore liefert die einfache Ticker-Route in US-Dollar (`USD`), daher werden CoinLore-Preise in USD angezeigt.
- Fuer All-Time-Daten kann die API-Antwort groesser sein als bei kurzen Zeitraeumen.
- Da alles im Browser laeuft, wird kein API-Key gespeichert oder benoetigt.

## Lizenz

Dieses Projekt steht unter der GNU General Public License v3.0 oder spaeter (`GPL-3.0-or-later`).

FOSS ist Freiheit. Sharing is caring.
