pdfjs_version=4.3.136

wget "https://github.com/mozilla/pdf.js/releases/download/v$pdfjs_version/pdfjs-$pdfjs_version-dist.zip"
unzip -o "pdfjs-$pdfjs_version-dist.zip" "web/*" -d "."
unzip -o "pdfjs-$pdfjs_version-dist.zip" "build/*" -d "."
mv "./web/viewer.html" "./web/index.html"
cp "yomitan-pdf-viewer.pdf" "./web/compressed.tracemonkey-pldi-09.pdf"

rm "pdfjs-$pdfjs_version-dist.zip"