curl https://www.unicode.org/Public/security/latest/confusables.txt > confusables.txt
curl https://www.unicode.org/Public/security/latest/intentional.txt > intentional.txt
python make_confusables_js.py
python make_intentionals_js.py
