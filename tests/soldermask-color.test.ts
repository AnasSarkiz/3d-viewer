import { expect, test } from "bun:test"
import type { PcbBoard } from "circuit-json"
import * as THREE from "three"
import { getSoldermaskPalette } from "../src/textures/soldermask/soldermask-drawing"
import {
  resolveSoldermaskColor,
  SOLDERMASK_PRESET_HEX,
} from "../src/utils/soldermask-color"

const createBoard = ({
  material = "fr4",
  solderMaskColor,
}: {
  material?: PcbBoard["material"]
  solderMaskColor?: string
}): PcbBoard => ({
  type: "pcb_board",
  pcb_board_id: "test-board",
  center: { x: 0, y: 0 },
  width: 10,
  height: 10,
  thickness: 1.6,
  material,
  num_layers: 2,
  ...(solderMaskColor !== undefined && {
    solder_mask_color: solderMaskColor,
  }),
})

const toSrgbHex = (color: THREE.Color) =>
  `#${color.getHexString(THREE.SRGBColorSpace)}`

test("resolves the documented non-green soldermask presets", () => {
  for (const [preset, expectedHex] of Object.entries(SOLDERMASK_PRESET_HEX)) {
    const color = resolveSoldermaskColor(preset)
    expect(color).not.toBeNull()
    if (color) expect(toSrgbHex(color)).toBe(expectedHex)
  }
})

test("preserves the existing material colors without an explicit preset", () => {
  expect(getSoldermaskPalette(createBoard({}))).toMatchObject({
    soldermask: "rgb(15, 79, 48)",
    soldermaskOverCopper: "rgb(23, 97, 59)",
  })
  expect(
    getSoldermaskPalette(createBoard({ solderMaskColor: "not_specified" })),
  ).toMatchObject({
    soldermask: "rgb(15, 79, 48)",
    soldermaskOverCopper: "rgb(23, 97, 59)",
  })
  expect(
    getSoldermaskPalette(createBoard({ solderMaskColor: "green" })),
  ).toMatchObject({
    soldermask: "rgb(15, 79, 48)",
    soldermaskOverCopper: "rgb(23, 97, 59)",
  })
  expect(getSoldermaskPalette(createBoard({ material: "fr1" }))).toMatchObject({
    soldermask: "rgb(5, 26, 10)",
    soldermaskOverCopper: "rgb(230, 153, 51)",
  })
  expect(
    getSoldermaskPalette(
      createBoard({ material: "fr1", solderMaskColor: "green" }),
    ),
  ).toMatchObject({
    soldermask: "rgb(5, 26, 10)",
    soldermaskOverCopper: "rgb(230, 153, 51)",
  })
})

test("falls back to the existing material color for unknown strings", () => {
  expect(resolveSoldermaskColor("kicad:custom_solder_mask")).toBeNull()
  expect(
    getSoldermaskPalette(
      createBoard({ solderMaskColor: "kicad:custom_solder_mask" }),
    ).soldermask,
  ).toBe("rgb(15, 79, 48)")
})

test("uses calibrated preset colors over substrate and masked copper", () => {
  const expectedPalettes = {
    red: ["rgb(101,2,2)", "rgb(119,60,34)"],
    blue: ["rgb(0,63,125)", "rgb(42,70,124)"],
    purple: ["rgb(76,29,105)", "rgb(86,45,105)"],
    black: ["rgb(7,16,20)", "rgb(22,23,22)"],
    white: ["rgb(221,221,221)", "rgb(218,215,211)"],
    yellow: ["rgb(220,200,74)", "rgb(218,197,76)"],
  }

  for (const [
    solderMaskColor,
    [soldermask, soldermaskOverCopper],
  ] of Object.entries(expectedPalettes)) {
    expect(
      getSoldermaskPalette(createBoard({ solderMaskColor })),
    ).toMatchObject({ soldermask, soldermaskOverCopper })
  }
})
