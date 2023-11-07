![Blurp](https://img.itch.zone/aW1nLzEzOTU2NDQzLnBuZw==/original/fXAEWf.png)


## [PLAY HERE](https://jani-nykanen.itch.io/one-last-adventure?secret=uCx6rqMbaLMlsDbOlYlJG0qyRbI) (secret link, not yet fully public)


**One Last Adventure** is a pixel-art metroidvania for web, created using standard web technologies including WebGL, WebAudio and whatever the gamepad API is known as. The game is written in TypeScript, because there is no way I would touch plain JavaScript any longer.

-----

## Compiling

The following tools are required:
- Typescript compiler
That's all.


To compile, run `tsc` on root. That's it. Running `make dist` will create a zip package for you. I might add Closure compiler support one day. 


------


## Code style

When starting the project I had this funny idea that all the variables should be declared in the main function body, not inside control blocks. In the middle of the project I asked myself, "Why?", but couldn't figure out an answer. However, it was already too late (not really, but let's pretend it was) to change the coding style at that point.

There are also some other oddities I have forgotten. And a lot of "TODO"s I decided not-to-do.


------


## License

- The source code, which includes all the `.ts`,`.html` and `makefile` files, is licensed under (*throws a die*) MIT license.
- The music files, which contains all `.ogg` files **excluding `item.ogg`** are licensed under CC-BY-NC-4.0. Use of these asset files should be attributed to H0dari
- All the other asset files not contained in the previous item (that is, all art, level and sound effect files) are licensed under CC-BY-NC-4.0, and should be attributed to Jani Nykänen.

In short: you can do almost everything with the code, even use it for commercial purposes without having to give a credit, but **the asset files cannot be used for commercial purposes and givin a credit is mandatory if the work is derived**.


