import { describe, it, expect } from "vitest";
import { parseUnitanquesText } from "@/components/cold_block/unitanques_tab";

describe("parseUnitanquesText", () => {
  it("should return empty array for empty input", () => {
    expect(parseUnitanquesText("")).toEqual([]);
    expect(parseUnitanquesText("   ")).toEqual([]);
  });

  it("should parse simple unitanque blocks", () => {
    const rawText = `
      BBT 1
      Modelo Exp
      BBT 2
      Corona Nal
      HL
      1129
      ppb
      6
      Hrs
      32
    `;
    const parsed = parseUnitanquesText(rawText);
    expect(parsed).toHaveLength(2);
    
    expect(parsed[0]).toEqual({
      tanque: "BBT 1",
      marca: "Modelo Exp",
      volumenHl: 0,
      ppb: 0,
      hrs: 0
    });

    expect(parsed[1]).toEqual({
      tanque: "BBT 2",
      marca: "Corona Nal",
      volumenHl: 1129,
      ppb: 6,
      hrs: 32
    });
  });

  it("should handle custom brand names and ignore keywords", () => {
    const rawText = `
      BBT 10
      NO SELECT
      HL
      62
      ppb
      9
      Hrs
      33
      BBT 11
      HL
      1493
    `;
    const parsed = parseUnitanquesText(rawText);
    expect(parsed).toHaveLength(2);

    expect(parsed[0]).toEqual({
      tanque: "BBT 10",
      marca: "NO SELECT",
      volumenHl: 62,
      ppb: 9,
      hrs: 33
    });

    expect(parsed[1]).toEqual({
      tanque: "BBT 11",
      marca: "NO SELECT",
      volumenHl: 1493,
      ppb: 0,
      hrs: 0
    });
  });

  it("should handle volume, ppb, and hrs on the same line", () => {
    const rawText = `
      BBT 12
      Victoria Nal
      HL: 2450
      ppb: 12
      Hrs: 45
      BBT 13
      Corona Nal
      Volumen 1688
    `;
    const parsed = parseUnitanquesText(rawText);
    expect(parsed).toHaveLength(2);

    expect(parsed[0]).toEqual({
      tanque: "BBT 12",
      marca: "Victoria Nal",
      volumenHl: 2450,
      ppb: 12,
      hrs: 45
    });

    expect(parsed[1]).toEqual({
      tanque: "BBT 13",
      marca: "Corona Nal",
      volumenHl: 1688,
      ppb: 0,
      hrs: 0
    });
  });
});
