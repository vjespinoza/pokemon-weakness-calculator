let form = document.getElementById("form");
let input = document.getElementById("form__input");
let button = document.getElementById("form__button");
let results = document.getElementById("results");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let query = input.value;
    axios
        .get(`https://pokeapi.co/api/v2/pokemon/${query}`)
        .then((res) => {
            input.value = "";
            let name = res.data.name;
            let types = res.data.types.map((t) => {
                return t.type.name;
            });

            return types;
        })
        .then((types) => {
            types.map((t) => {
                axios.get(`https://pokeapi.co/api/v2/type/${t}`).then((res) => {
                    console.log(res.data.damage_relations);
                });
            });
        });
});
