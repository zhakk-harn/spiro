/**
 * this software assumes that your dataset is a flat array of monomorphic and isomorphic objects encoded in JSON (which is the kind of stuff  you'll get from excel/google_sheets and CSV files)
 *
 * - progressively save the whole thing in the localstorage so refreshing doesn't loose everything
 * - add datasetPosition as a feature
 *
 * each data point is a graphical object
 * a graphical object has many attirbutes
 * graphical attributes matches a data attribute
 * flatly
 * position based (e.g. some amount * position in array)
 *
 * datapoint => shape
 *
 * Type numericalMapping = label (fromMin fromMax) toMin toMax
 * Type qualitativeMapping = label => color
 * Type numericalCondition = range => color
 * Type conditionnalBinding = label enum(equal, not equal, greater, lesser) color
 * Type Value = enum(calor, value)
 * needs getMin and getMax function to autodectect them for a feature
 * () = detect on new
 * [] = optionnal => put in a folder
 *
 * Boolean = (Qualitative || Quantitative) + comparator
 * Number = Quantitative
 *
 */

//https://stackoverflow.com/questions/18366229/is-it-possible-to-create-a-button-using-dat-gui
//https://stackoverflow.com/questions/30372761/map-dat-gui-dropdown-menu-strings-to-values
const gui = new dat.GUI();

let dataset = null;
let metadata = {};

let fill = null;

let config = {
  dataset: "dataset.json",
  load_dataset: () => loadDataset(config.dataset),
  save_config: () => localStorage.setItem("config", JSON.stringify(config)),
  copy_config: () => navigator.clipboard.writeText(JSON.stringify(config)),
  clear_config: () => localStorage.removeItem("config"),
  legend: "./legend.png",
  background: "#000",
  rules: {
    factory_count: 0,
    add: (rule) => {
      config.rules.factory_count += 1;
      config.rules.rules.push(rule);
      return rule;
    },
    rules: [],
  },
  represantation: {
    kind: "circle",
    params: {
      x: {
        //classable
        feature: "",
        fromMin: 0,
        fromMax: 0,
        toMin: 0,
        toMax: 0,
      },
      y: {
        //classable
        feature: "",
        fromMin: 0,
        fromMax: 0,
        toMin: 0,
        toMax: 0,
      },
      radius: "0",
      fill: {
        rules: [],
      },
      strokeWidth: {},
    },
  },
};

//init
gui.add(config, "dataset");
gui.add(config, "load_dataset");
gui.add(config, "save_config");
gui.add(config, "copy_config");
gui.add(config, "clear_config");

if (localStorage.getItem("config")) {
  config = JSON.parse(localStorage.getItem("config"));
}

config.represantation.params.fill.add = addFillRule;

const sketch = (p) => {
  p.setup = function () {
    p.createCanvas(window.innerWidth, window.innerHeight);
  };

  p.draw = function () {
    // console.log(config.represantation.params);
    if (!dataset) {
      return;
    }

    p.background(config.background);

    // p.map(dataset[0][feature], fromMin, fromMax, toMin, toMax);
    // each point above should be interpolable (interpolable = mapping function + progress + from + to)
    dataset.forEach((dataPoint) => {
      {
        p.push();
        config.represantation.params.fill.rules.forEach((fillRule) => {
          if (dataPoint[fillRule.feature] == fillRule.match) {
            p.fill(fillRule.value);
          }
        });
        const x = p.map(
          dataPoint[config.represantation.params.x.feature],
          config.represantation.params.x.fromMin,
          config.represantation.params.x.fromMax,
          config.represantation.params.x.toMin,
          config.represantation.params.x.toMax
        );
        const y = p.map(
          dataPoint[config.represantation.params.y.feature],
          config.represantation.params.y.fromMin,
          config.represantation.params.y.fromMax,
          config.represantation.params.y.toMin,
          config.represantation.params.y.toMax
        );
        p.circle(x, y, 35); // can observe three mappings
        p.pop();
      }
    });
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};
new p5(sketch);

async function loadDataset(path) {
  dataset = await (await fetch(config.dataset)).json();
  console.log(dataset);
  gui.add(config, "legend");
  gui.addColor(config, "background");
  const repr = gui.addFolder("representation");
  repr.open();
  repr.add(config.represantation, "kind", { circle: "circle" });
  const params = repr.addFolder("params");
  params.open();

  const x = params.addFolder("x");
  x.open();
  const feature = x.add(
    config.represantation.params.x,
    "feature",
    arrayToDatChoices(getQuantitativeFeaturesEnum())
  );
  const fromMin = x.add(config.represantation.params.x, "fromMin");
  const fromMax = x.add(config.represantation.params.x, "fromMax");
  x.add(config.represantation.params.x, "toMin", 0, window.innerWidth, 1);
  x.add(
    config.represantation.params.x,
    "toMax",
    0,
    window.innerWidth,
    1
  ).setValue(window.innerWidth);
  feature.onFinishChange((value) => {
    console.log(typeof value, value, getMin(value));
    fromMin.setValue(getMin(value));
    fromMax.setValue(getMax(value));
  });

  const y = params.addFolder("y");
  y.open();
  const yFeature = y.add(
    config.represantation.params.y,
    "feature",
    arrayToDatChoices(getQuantitativeFeaturesEnum())
  );
  const yFromMin = y.add(config.represantation.params.y, "fromMin");
  const yFromMax = y.add(config.represantation.params.y, "fromMax");
  y.add(config.represantation.params.y, "toMin", 0, window.innerHeight, 1);
  y.add(
    config.represantation.params.y,
    "toMax",
    0,
    window.innerHeight,
    1
  ).setValue(window.innerHeight);
  yFeature.onFinishChange((value) => {
    console.log(typeof value, value, getMin(value));
    yFromMin.setValue(getMin(value));
    yFromMax.setValue(getMax(value));
  });

  params.add(config.represantation.params, "radius");

  console.log(config.represantation.params.fill);
  fill = params.addFolder("fill");
  fill.open();
  fill.add(config.represantation.params.fill, "add");
  config.represantation.params.fill.rules.forEach((fillRule, i) => {
    const currentFolder = fill.addFolder("fill " + i);
    currentFolder.open();
    currentFolder.add(
      fillRule,
      "feature",
      arrayToDatChoices(getQualitativeFeaturesEnum())
    );
    currentFolder.add(fillRule, "match");
    currentFolder.addColor(fillRule, "value");
  });
}

function addFillRule() {
  const newRule = {
    feature: "Metier",
    match: "",
    value: "#fff",
  };

  config.represantation.params.fill.rules.push(newRule);

  const currentFolder = fill.addFolder(
    "fill " + config.represantation.params.fill.rules.length
  );
  currentFolder.open();
  currentFolder.add(
    newRule,
    "feature",
    arrayToDatChoices(getQualitativeFeaturesEnum())
  );
  currentFolder.add(newRule, "match");
  currentFolder.addColor(newRule, "value");
}

function getMin(feature) {
  if (
    !metadata[feature] ||
    (!metadata[feature].min && !metadata[feature].min != 0)
  ) {
    if (!metadata[feature]) metadata[feature] = {};

    metadata[feature].min = dataset.reduce(
      (acc, el) => (acc < el[feature] ? acc : el[feature]),
      Number.POSITIVE_INFINITY
    );
  }

  return metadata[feature].min;
}

function getMax(feature) {
  if (
    !metadata[feature] ||
    (!metadata[feature].max && !metadata[feature].max != 0)
  ) {
    if (!metadata[feature]) metadata[feature] = {};

    metadata[feature].max = dataset.reduce(
      (acc, el) => (acc > el[feature] ? acc : el[feature]),
      Number.NEGATIVE_INFINITY
    );
  }

  return metadata[feature].max;
}

function getFeatureEnum() {
  if (!dataset) {
    return null;
  }
  return Object.keys(dataset[0]);
}

function getQuantitativeFeaturesEnum() {
  if (!dataset) {
    return null;
  }
  return Object.keys(dataset[0]).filter(
    (feature) => typeof dataset[0][feature] == "number"
  );
}

function getQualitativeFeaturesEnum() {
  if (!dataset) {
    return null;
  }
  return Object.keys(dataset[0]).filter(
    (feature) => typeof dataset[0][feature] == "string"
  );
}

function arrayToDatChoices(arr) {
  let choices = {};
  arr.forEach((el) => (choices[el] = el));
  return choices;
}

function isQuantitative(feature) {
  return typeof dataset[0][feature] == "number";
}
