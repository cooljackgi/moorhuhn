# Moorhuhn aus Blender

Eigenes Comic-Moorhuhn mit warmbraunen Federn, hellem Bauch, rotem Kamm,
großen Augen und einer einsekündigen Flugschleife.

- `moorhuhn.blend`: editierbares Modell, Materialien, Animation, Kamera und Licht.
  Die Figur steht in der Szene `Moorhuhn_Asset`. Die vorherige Szene bleibt erhalten.
- `moorhuhn.glb`: Figur mit der gemeinsamen Animation `Flight`, ohne Studiolichter.
  Vorwärtsrichtung in Blender: +X, oben: +Z. Export ins glTF-Koordinatensystem erfolgt automatisch.
- `moorhuhn-preview.png`: transparente Vorschau, 1024 × 1024 Pixel.
- `moorhuhn-flight.png`: transparentes Sprite-Sheet, acht Felder horizontal,
  jeweils 384 × 384 Pixel, gesamte Größe 3072 × 384 Pixel.
- `moorhuhn-flight.json`: Maße, Bildrate und Ankerpunkt.
- `frames/flight-00.png` bis `flight-07.png`: einzelne Flugphasen, 8 Bilder/s.
- `create_moorhuhn.py` und `render_moorhuhn.py`: reproduzierbare Blender-Skripte.

## Verwendung im bestehenden Canvas-Spiel

Das aktuelle `Target.draw()` zeichnet die Figur noch mit Canvas-Pfaden.
`Target.draw()` verwendet jetzt das Sprite-Sheet für normale und goldene fliegende
Hühner. Goldene Hühner erhalten einen Goldfilter und behalten ihre Aura.
Solange die Grafik lädt oder wenn sie nicht geladen werden kann, bleibt die bisherige
Canvas-Zeichnung als Ersatz aktiv. Größe, Richtungsspiegelung und Trefferlogik bleiben erhalten.
Ein geladenes Sprite-Sheet wird mit diesem Ausschnitt gezeichnet:

```js
const frame = Math.floor(this.flapTime / 125) % 8;
const extent = this.size * 2.8;
// Nach translate(this.x, this.y) und der vorhandenen Richtungsspiegelung:
ctx.drawImage(spriteSheet, frame * 384, 0, 384, 384,
  -extent / 2, -extent / 2, extent, extent);
```

## Erneut erzeugen

`create_moorhuhn.py` in Blender ausführen, anschließend die gespeicherte
`moorhuhn.blend` mit `render_moorhuhn.py` rendern. Das Modell nutzt Blender 4.4.
Die Erstellung ersetzt ausschließlich die eigene Szene `Moorhuhn_Asset`.
