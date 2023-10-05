

export const getMapName = (id : number) : string =>
    ["void", "island"][id] ?? "void";
    