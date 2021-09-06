let form = document.getElementById("form");
let input = document.getElementById("form__input");
let results = document.getElementById("results");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let query = input.value;
    query &&
        axios
            .get(`https://pokeapi.co/api/v2/pokemon/${query}`)
            .then((res) => {
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
                let requestArray = types[1] ? [req1, req2] : [req1];

                axios
                    .all(requestArray)
                    .then(
                        axios.spread((...responses) => {
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
                    });
            });
});

const calculateWeakness = (types) => {
    let { name, type_a, type_b } = types;
    let commonTypes = [];
    let uncommonTypes = [...type_a, ...type_b];

    type_a.map((x) => {
        type_b.map((y, i) => {
            if (Object.values(x).includes(Object.values(y)[0])) {
                commonTypes.push({ name: y.name, value: x.value * y.value });
                uncommonTypes = uncommonTypes.filter((z) => {
                    return z.name !== x.name;
                });
            }
        });
    });

    let weakness = [...commonTypes, ...uncommonTypes].filter((w) => {
        return w.value >= 2;
    });
    writeResults(name, weakness);
    return weakness;
};

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
