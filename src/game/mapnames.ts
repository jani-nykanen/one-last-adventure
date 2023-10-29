

export const getMapName = (id : number) : string =>
    ["void", "island", "caves", "castle"][id] ?? "void";
    