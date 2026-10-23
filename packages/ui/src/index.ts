/**
 * @sangamora/ui — design system for the sangamora Kumbh sandbox (React 19).
 *
 * CONSUMER THEME CONTRACT — the host app's Tailwind @theme must define these
 * named colour tokens; every primitive only references standard Tailwind
 * utilities composed from them (text-/bg-/border-/fill-/stroke- variants and
 * opacity modifiers included):
 *
 *   ink         #160919   (also: bg-ink-muted, border-ink-10)
 *   surface               (overlay card colour, e.g. #2A1533)
 *   paper       #FFF6E8
 *   saffron     #FF8A00
 *   marigold    #FFB128
 *   river       #0E7C7B
 *   lotus       #E5399C
 *   vermillion  #D63C2F
 *   gold        #C9A227
 *   festival    #7A3B8F
 *   risk-green  #2FA36B
 *   risk-amber  #FFB020
 *   risk-orange #FF7A00
 *   risk-red    #E03E2D
 */

// buttons
export { Button } from "./primitives/buttons/button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./primitives/buttons/button";
export { IconButton } from "./primitives/buttons/icon-button";
export type { IconButtonProps, IconButtonSize, IconButtonVariant } from "./primitives/buttons/icon-button";
export { Chip } from "./primitives/buttons/chip";
export type { ChipProps, ChipStatus } from "./primitives/buttons/chip";

// containers
export { Surface } from "./primitives/containers/surface";
export type { SurfaceProps } from "./primitives/containers/surface";
export { Section } from "./primitives/containers/section";
export type { SectionProps } from "./primitives/containers/section";
export { Grid } from "./primitives/containers/grid";
export type { GridCols, GridGap, GridProps } from "./primitives/containers/grid";
export { Card } from "./primitives/containers/card";
export type { CardPadding, CardProps, CardTone } from "./primitives/containers/card";

// text
export { Heading } from "./primitives/text/heading";
export type { HeadingProps, HeadingSize } from "./primitives/text/heading";
export { Eyebrow } from "./primitives/text/eyebrow";
export type { EyebrowProps } from "./primitives/text/eyebrow";
export { Lead } from "./primitives/text/lead";
export type { LeadProps } from "./primitives/text/lead";
export { P } from "./primitives/text/p";
export type { PProps } from "./primitives/text/p";
export { Link, isExternalHref } from "./primitives/text/link";
export type { LinkProps } from "./primitives/text/link";
export { Kbd } from "./primitives/text/kbd";
export type { KbdProps } from "./primitives/text/kbd";
export { Code } from "./primitives/text/code";
export type { CodeProps } from "./primitives/text/code";

// form
export { Input } from "./primitives/form/input";
export type { InputProps } from "./primitives/form/input";
export { Textarea } from "./primitives/form/textarea";
export type { TextareaProps } from "./primitives/form/textarea";
export { Select } from "./primitives/form/select";
export type { SelectOption, SelectProps } from "./primitives/form/select";
export { Switch } from "./primitives/form/switch";
export type { SwitchProps } from "./primitives/form/switch";
export { Field } from "./primitives/form/field";
export type { FieldProps } from "./primitives/form/field";
export { RadioGroup } from "./primitives/form/radio-group";
export type { RadioGroupProps, RadioOption } from "./primitives/form/radio-group";
export { SegmentedControl } from "./primitives/form/segmented-control";
export type { SegmentedControlProps, SegmentedOption } from "./primitives/form/segmented-control";

// data
export { Stat } from "./primitives/data/stat";
export type { StatDirection, StatProps } from "./primitives/data/stat";
export { StatRow } from "./primitives/data/stat-row";
export type { StatEntry, StatRowProps } from "./primitives/data/stat-row";
export { Meter, clampPercent, meterBand } from "./primitives/data/meter";
export type { MeterBand, MeterProps } from "./primitives/data/meter";
export { Ring } from "./primitives/data/ring";
export type { RingProps } from "./primitives/data/ring";
export { Sparkline, sparklinePoints } from "./primitives/data/sparkline";
export type { SparklineProps } from "./primitives/data/sparkline";
export { Bars, scaleBars } from "./primitives/data/bars";
export type { BarColor, BarDatum, BarsProps, ScaledBar } from "./primitives/data/bars";
export { DataTable, sortRows, sortableValue } from "./primitives/data/data-table";
export type { DataTableColumn, DataTableProps } from "./primitives/data/data-table";
export { Detail } from "./primitives/data/detail";
export type { DetailItem, DetailProps } from "./primitives/data/detail";
export { Kv } from "./primitives/data/kv";
export type { KvProps } from "./primitives/data/kv";
export { Rule } from "./primitives/data/rule";
export type { RuleProps } from "./primitives/data/rule";
export { Badge } from "./primitives/data/badge";
export type { BadgeProps, BadgeTone } from "./primitives/data/badge";
export { Tag } from "./primitives/data/tag";
export type { TagKind, TagProps } from "./primitives/data/tag";
export { Ticker, sanitizeCounter } from "./primitives/data/ticker";
export type { TickerProps } from "./primitives/data/ticker";
export { Spinner } from "./primitives/data/spinner";
export type { SpinnerProps } from "./primitives/data/spinner";
export { Progress } from "./primitives/data/progress";
export type { ProgressProps } from "./primitives/data/progress";

// feedback
export { Note } from "./primitives/feedback/note";
export type { NoteProps, NoteTone } from "./primitives/feedback/note";
export { Empty } from "./primitives/feedback/empty";
export type { EmptyProps } from "./primitives/feedback/empty";
export { Tooltip } from "./primitives/feedback/tooltip";
export type { TooltipProps } from "./primitives/feedback/tooltip";
export { Toast } from "./primitives/feedback/toast";
export type { ToastItem, ToastProps } from "./primitives/feedback/toast";
export { InlineError } from "./primitives/feedback/inline-error";
export type { InlineErrorProps } from "./primitives/feedback/inline-error";

// overlay
export { Modal } from "./primitives/overlay/modal";
export type { ModalProps } from "./primitives/overlay/modal";
export { Drawer } from "./primitives/overlay/drawer";
export type { DrawerProps, DrawerSide } from "./primitives/overlay/drawer";
export { Popover } from "./primitives/overlay/popover";
export type { PopoverProps } from "./primitives/overlay/popover";

// layout
export { Tabs } from "./primitives/layout/tabs";
export type { TabDef, TabsProps } from "./primitives/layout/tabs";
export { Accordion } from "./primitives/layout/accordion";
export type { AccordionItem, AccordionProps } from "./primitives/layout/accordion";
export { Sidebar } from "./primitives/layout/sidebar";
export type { NavLink, SidebarProps } from "./primitives/layout/sidebar";
export { Topbar } from "./primitives/layout/topbar";
export type { TopbarProps } from "./primitives/layout/topbar";
export { Rail } from "./primitives/layout/rail";
export type { RailItem, RailProps } from "./primitives/layout/rail";

// visual motifs
export { Rangoli, rangoliTriangles } from "./primitives/motifs/rangoli";
export type { RangoliProps, RangoliTriangle } from "./primitives/motifs/rangoli";
export { Diya } from "./primitives/motifs/diya";
export type { DiyaProps } from "./primitives/motifs/diya";
export { Kalash } from "./primitives/motifs/kalash";
export type { KalashProps } from "./primitives/motifs/kalash";
export { Om } from "./primitives/motifs/om";
export type { OmProps } from "./primitives/motifs/om";
export { Divider } from "./primitives/motifs/divider";
export type { DividerProps, DividerTone } from "./primitives/motifs/divider";
export { Mandala, mandalaDots } from "./primitives/motifs/mandala";
export type { MandalaDot, MandalaProps } from "./primitives/motifs/mandala";
