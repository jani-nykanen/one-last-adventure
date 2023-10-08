

export const getMapName = (id : number) : string =>
    ["void", "island", "caves"][id] ?? "void";
    