import React from "react";
export const CustomDot = (props: any) => {
    const { cx, cy, index, selectedIndices, stroke } = props;
    if (selectedIndices && selectedIndices.includes(index)) {
        return (
            <circle cx={cx} cy={cy} r={5} fill={stroke} stroke="white" strokeWidth={2} />
        );
    }
    return null;
};
