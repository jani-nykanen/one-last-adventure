.PHONY: js
js:
	tsc

watch:
	tsc -w

server:
	python3 -m http.server


linecount:
	find . -name '*.ts' | xargs wc -l
	

pack:
	mkdir -p temp
	cp -r assets temp/assets
	cp -r js temp/js
	cp index.html temp/index.html
	(cd temp; zip -r ../dist.zip .)
	rm -rf ./temp

dist: js pack
