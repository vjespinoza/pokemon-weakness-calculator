let form = document.getElementById("form");
let input = document.getElementById("form__input");
let results = document.getElementById("results");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    //Clears results div before new request
    cleanResults();

    let query = input.value;

    //Performs a request based the pokémon's name or ID, after validating that the input is not empty.
    query &&
        axios
            .get(`https://pokeapi.co/api/v2/pokemon/${query}`)
            .then((res) => {
                //Get the types of the queried pokémon
                input.value = "";
                let name = res.data.name;
                let types = res.data.types.map((t) => {
                    return t.type.name;
                });

                return { name, types };
            })
            .then(({ name, types }) => {
                let damageByType = {
                    name: name,
                    type_a: [],
                    type_b: [],
                };

                let req1 = axios.get(
                    `https://pokeapi.co/api/v2/type/${types[0]}`
                );

                let req2 = types[1]
                    ? axios.get(`https://pokeapi.co/api/v2/type/${types[1]}`)
                    : null;

                //Prepares the request array based on the number of types the pokémon has
                let requestArray = types[1] ? [req1, req2] : [req1];

                //Conditionally performs 1 or 2 requests depending on how many types the pokémon has
                //The rquests are made to the /type endpoint in order to obtain the damage_relations object.
                axios
                    .all(requestArray)
                    .then(
                        axios.spread((...responses) => {
                            //Prepares the damageByType object in order to feed the calculateWeakness function down below
                            //It creates 1 or 2 arrays (type_a and type_b) based on how many types the pokémon has.
                            //Each array contains objects with the name of the type/damage relation and the value of the damage
                            let res1 = responses[0];
                            let res2 = responses[1] ? responses[1] : null;

                            damageByType.type_a = [
                                ...res1.data.damage_relations.double_damage_from.map(
                                    (n) => {
                                        return { name: n.name, value: 2 };
                                    }
                                ),
                                ...res1.data.damage_relations.half_damage_from.map(
                                    (n) => {
                                        return { name: n.name, value: 0.5 };
                                    }
                                ),
                                ...res1.data.damage_relations.no_damage_from.map(
                                    (n) => {
                                        return { name: n.name, value: 0 };
                                    }
                                ),
                            ];

                            damageByType.type_b = res2
                                ? [
                                      ...res2.data.damage_relations.double_damage_from.map(
                                          (n) => {
                                              return { name: n.name, value: 2 };
                                          }
                                      ),
                                      ...res2.data.damage_relations.half_damage_from.map(
                                          (n) => {
                                              return {
                                                  name: n.name,
                                                  value: 0.5,
                                              };
                                          }
                                      ),
                                      ...res2.data.damage_relations.no_damage_from.map(
                                          (n) => {
                                              return { name: n.name, value: 0 };
                                          }
                                      ),
                                  ]
                                : [];

                            return damageByType;
                        })
                    )
                    .then((damageByType) => {
                        calculateWeakness(damageByType);
                    })
                    .catch((error) => {
                        console.log(error);
                        return;
                    });
            })
            .catch((error) => {
                if (error) {
                    notifyError();
                }
            });
});

//calculate the weaknesses based on the damage relations pull from the API
const calculateWeakness = (types) => {
    let { name, type_a, type_b } = types;
    let commonTypes = [];
    let uncommonTypes = [...type_a, ...type_b];

    //Iterates over the arrays to find common type names
    type_a.map((x) => {
        type_b.map((y) => {
            if (Object.values(x).includes(Object.values(y)[0])) {
                //If both arrays share types, the values are multiplied and they get pushed to commonTypes
                commonTypes.push({ name: y.name, value: x.value * y.value });

                //The remaning types are filtered out of uncommonTypes
                uncommonTypes = uncommonTypes.filter((z) => {
                    return z.name !== x.name;
                });
            }
        });
    });

    //commonTypes and uncommonTypes are concatenated and then the weaknesses with values equal o higher to 2 are filtered
    let weakness = [...commonTypes, ...uncommonTypes].filter((w) => {
        return w.value >= 2;
    });

    writeResults(name, weakness);

    return weakness;
};

//Writes the resulting weaknesses to the document
const writeResults = (name, weakness) => {
    let header = document.createElement("h2");
    header.innerHTML = `<span>${name}</span> is weak against: `;

    let list = document.createElement("ul");

    results.appendChild(header);
    results.appendChild(list);

    weakness.forEach((w) => {
        let color = colorizer(w.name);
        let listItem = document.createElement("li");
        listItem.setAttribute(
            "style",
            `background-image: linear-gradient(to top, ${color[1]}, ${color[0]})`
        );
        listItem.textContent = `${w.name} ${w.value}x`;
        list.appendChild(listItem);
    });
};

//Writes error message to the document
const notifyError = () => {
    let error = document.createElement("h2");
    error.textContent = "Incorrect name or ID, please try again...";
    error.setAttribute("style", "color: #d60000");
    results.appendChild(error);
};

//Clears the results div for new request to be written
const cleanResults = () => {
    results.innerHTML = "";
};

//Fills the background of each weakness (listItem) with the proper color.
const colorizer = (type) => {
    let pokeTypeColors = {
        bug: ["#729f3f", "#729f3f"],
        dark: ["#707070", "#707070"],
        dragon: ["#53a4cf", "#f16e57"],
        electric: ["#eed535", "#eed535"],
        fairy: ["#fdb9e9", "#fdb9e9"],
        fighting: ["#d56723", "#d56723"],
        fire: ["#fd7d24", "#fd7d24"],
        flying: ["#3dc7ef", "#bdb9b8"],
        ghost: ["#7b62a3", "#7b62a3"],
        grass: ["#9bcc50", "#9bcc50"],
        ground: ["#f7de3f", "#ab9842"],
        ice: ["#51c4e7", "#51c4e7"],
        normal: ["#a4acaf", "#a4acaf"],
        poison: ["#b97fc9", "#b97fc9"],
        psychic: ["#f366b9", "#f366b9"],
        rock: ["#a38c21", "#a38c21"],
        steel: ["#9eb7b8", "#9eb7b8"],
        water: ["#4592c4", "#4592c4"],
    };

    let color = pokeTypeColors[type];

    return color;
};
