.PHONY: js
js:
	tsc

watch:
	tsc -w

server:
	python3 -m http.server
