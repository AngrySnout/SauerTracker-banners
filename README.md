# SauerTracker Banners

## How does it work?
It creates an image based on a theme and some variables. Simple as that. These variables can be player, server, or clan stats. You can either use built-in themes or create custom ones.

## How to use it?
*http://banners.sauertracker.net/player?name=...&theme=...*   
*http://banners.sauertracker.net/server?host=...&port=...&theme=...*   
*http://banners.sauertracker.net/clan?host=...&port=...&theme=...*

## Default themes:
The following themes are built-in (more themes will be added later):

- default (player, server, and clan)

	![](http://banners.sauertracker.net/player?name=Nix&theme=default)

	![](http://banners.sauertracker.net/server?host=164.132.110.240&port=28785&theme=default)

	![](http://banners.sauertracker.net/clan?clantag=!s]&theme=default)

## How to write themes?
A theme is a Handlebars template, which generates an SVG document, which is rendered and served as a PNG. Simple, no?

You can find help on writing Handlebars templates [here](http://handlebarsjs.com), and help on SVG [here](https://developer.mozilla.org/en-US/docs/Web/SVG).  
You can also get a headstart by reading the code of the built-in themes.

The following Handlebars block helpers are also available:
```
{{#ifeq a b}} a == b {{else}} a != b {{/ifeq}}

{{#iflt a b}} a < b {{else}} a >= b {{/ifeq}}

{{#ifgt a b}} a > b {{else}} a <= b {{/ifeq}}

{{#iflte a b}} a <= b {{else}} a > b {{/ifeq}}

{{#ifgte a b}} a >= b {{else}} a < b {{/ifeq}}
```

To use external images, you can simply put their URL in an `image` element. However it is recommended that you use the `cache` directive to make the banner load faster. For example:
```
<image xlink:href="{{cache "http://i.imgur.com/xxxxxxx.png"}}" .../>
```
will cache http://i.imgur.com/xxxxxxx.png locally and replace it with the URL to the cached one.

For country flag URLs (24x24 pixels) use the following directive:
```
{{flag countryCode}}
```

And for mapshot URLs (1024x1024 pixels):
```
{{mapshot mapName}}
```

You have access to the object returned from the SauerTracker API path corresponding to the type of the template. For example, in a server theme template you can use:
```
{{server.description}}
{{server.rank}}
...
```

And in a player theme template you can use:
```
{{player.name}}
{{player.totalGames}}
{{player.games.0.serverdesc}}
...
```
note however that the inner 'player' object is merged with the outer object (no need for `player.player.*`).

Same goes for a clan theme template:
```
{{clan.name}}
{{clan.games.0.timestamp}}
{{clan.members.0.name}}
...
```

Refer to https://sauertracker.net/api for more information on the *server*, *player*, and *clan* API paths.

See [built-in themes](https://github.com/AngrySnout/SauerTracker-banners/tree/master/themes) for some examples.

## Notes and bugs

* Be careful when using in-line HTML with the foreignObject element. The results in some browsers might be different from the server generated images. You must experiment.
* When writing a custom template, make sure you have all the fonts you used installed on your computer, or else preview will not work regardless of whether they are available on the server or not.

## License
GNU General Public License v3.0
