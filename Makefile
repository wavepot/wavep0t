
prod: build
	@NODE_ENV=production node app

build:
	@component-build -vc --use component-minify

dev-build:
	@component-build -dvc

clean:
	@rm -rf build

.PHONY: clean
