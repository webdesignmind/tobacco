const gulp = require("gulp");
const gulpif = require("gulp-if");
const pug = require("gulp-pug");
const del = require("del");
const browserSync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const cache = require("gulp-cache");
const autoprefixer = require("gulp-autoprefixer");

// styles
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");

let path = "build";
let docs = true;
if (process.title === "gulp prod") {
	path = "docs";
	docs = false;
}

let paths = {
	root: `./${path}`,
	templates: {
		pages: "src/templates/pages/*.pug",
		src: "src/templates/**/*.pug",
		dest: `${path}/assets/`,
	},
	styles: {
		src: "src/styles/**/*.scss",
		dest: `${path}/assets/styles/`,
	},
	css: {
		src: "src/styles/*.css",
		dest: `${path}/assets/styles/`,
	},
	scripts: {
		src: "src/scripts/**/*.*",
		dest: `${path}/assets/scripts/`,
	},
	images: {
		src: "src/images/**/*.*",
		dest: `${path}/assets/images/`,
	},
	svg: {
		src: "src/images/svg/**/*.*",
		dest: `${path}/assets/images/svg/`,
	},
	fonts: {
		src: "src/fonts/**/*.*",
		dest: `${path}/assets/fonts/`,
	},
};

//pug
function templates() {
	return gulp
		.src(paths.templates.pages)
		.pipe(pug({ pretty: true }))
		.pipe(gulp.dest(paths.root));
}

//scss
function styles() {
	return (
		gulp
			.src("./src/styles/app.scss")
			.pipe(sourcemaps.init())
			.pipe(sass(/*{ outputStyle: "compressed" }*/))
			.pipe(autoprefixer(["last 2 version", "> 1%", "maintained node versions", "not dead" /*"last 15 versions", "> 1%" , "ie 8", "ie 7"*/], { cascade: true })) // Создаем префиксы
			.pipe(gulpif(docs, sourcemaps.write()))
			// .pipe(rename({ suffix: ".min" }))
			.pipe(gulp.dest(paths.styles.dest))
	);
}

//scripts
function scripts() {
	return gulp.src(paths.scripts.src).pipe(gulp.dest(paths.scripts.dest));
}

//scripts
function css() {
	return gulp.src(paths.css.src).pipe(gulp.dest(paths.css.dest));
}

//fonts
function fonts() {
	return gulp.src(paths.fonts.src).pipe(gulp.dest(paths.fonts.dest));
}

// картинки
function images() {
	const docsNo = !docs;
	function img() {
		return imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.mozjpeg({ quality: 80, progressive: true }),
			imagemin.optipng({ optimizationLevel: 4, interlaced: true }),
			imagemin.svgo({
				plugins: [{ removeViewBox: false }, { cleanupIDs: false }],
			}),
		]);
	}
	return (
		gulp
			.src(paths.images.src) // Берем все изображения из app
			// .pipe(gulpif(docs, cache(img())))
			// .pipe(gulpif(docsNo, img()))
			.pipe(gulp.dest(paths.images.dest))
	); // Выгружаем на продакшен
}

// очистка
function clean() {
	return del(paths.root);
}

// следим за исходниками, папка src
function watch() {
	gulp.watch(paths.styles.src, styles);
	gulp.watch(paths.templates.src, templates);
	gulp.watch(paths.images.src, images);
	gulp.watch(paths.scripts.src, scripts);
	gulp.watch(paths.svg.src, svgSprite);
}

// следим за build и релоадим браузер
function server() {
	browserSync.init({
		server: paths.root,
	});
	browserSync.watch(paths.root + "/**/*.*", browserSync.reload);
}

//svg sprite

function svgSprite() {
	var svgSprite = require("gulp-svg-sprite");

	return gulp
		.src("./src/images/svg/*.svg") // svg files for sprite
		.pipe(
			svgSprite({
				mode: {
					stack: {
						sprite: "../sprite.svg", //sprite file name
					},
				},
			})
		)
		.pipe(gulp.dest("./src/images/"));
}

function libsCSS() {
	return gulp.src(["./node_modules/accordion-js/dist/accordion.min.css", "./node_modules/swiper/swiper-bundle.min.css"]).pipe(gulp.dest("src/styles/"));
}
function libsJS() {
	return gulp
		.src([
			"./node_modules/imask/dist/imask.min.js",
			"./node_modules/accordion-js/dist/accordion.min.js",
			"./node_modules/swiper/swiper-bundle.min.js",
			"./node_modules/medium-zoom/dist/medium-zoom.min.js",
			"./node_modules/focus-visible/dist/focus-visible.min.js",
		])
		.pipe(gulp.dest("src/scripts/"));
}

exports.templates = templates;
exports.styles = styles;
exports.clean = clean;
exports.images = images;
exports.scripts = scripts;
exports.fonts = fonts;
exports.css = css;
exports.svgSprite = svgSprite;
exports.libsCSS = libsCSS;
exports.libsJS = libsJS;

gulp.task("up-lb", gulp.series(gulp.parallel(libsCSS, libsJS)));

// просто работаем
gulp.task("default", gulp.series(gulp.parallel(styles, templates, images, scripts, fonts, css), gulp.parallel(watch, server)));

// контрольная сборка на продакшен
gulp.task("prod", gulp.series(clean, gulp.parallel(styles, templates, images, scripts, fonts, css)));
