# PLANARZ

Osobisty planer dnia, tygodnia i miesiąca. Etap 1: lokalne MVP bez konta, chmury i zadań okresowych.

## Stos

- React + TypeScript + Vite
- Dexie (IndexedDB) — trwały zapis w przeglądarce i w WebView Androida
- Capacitor 8 — opakowanie wersji webowej jako aplikacji Android

Zadania okresowe i automatyczne priorytety nie są jeszcze zaimplementowane. Nie pokazujemy ich w interfejsie, żeby nie udawać niedziałającej logiki.

## Uruchomienie w przeglądarce

Wymagany Node.js 22+.

```bash
npm install
npm run dev
```

Aplikacja działa offline po pierwszym załadowaniu. Dane zostają w IndexedDB po odświeżeniu strony.

## Testy i build

```bash
npm test
npm run lint
npm run build
```

## Android APK

1. Zainstaluj [Android Studio](https://developer.android.com/studio) i SDK.
2. Dodaj platformę (raz):

```bash
npx cap add android
```

3. Zsynchronizuj po każdej zmianie frontendu:

```bash
npm run cap:sync
```

4. Otwórz projekt w Android Studio i zbuduj APK: `npx cap open android`.

Jeśli `cap add android` zgłosi brak SDK, to jest jedyny oczekiwany bloker — sama aplikacja webowa jest kompletna dla Etapu 1.

## Zakres Etapu 1

- Widoki Dzisiaj, Dzień, Tydzień i Miesiąc na tych samych danych
- Zadania, opisy, podzadania (jeden poziom), odhaczanie, kolejność, przenoszenie między dniami
- Warianty dnia (domyślnie Łatwy / Średni / Trudny, max. 9)
- Lokalny zapis i komunikat przy błędzie zapisu
