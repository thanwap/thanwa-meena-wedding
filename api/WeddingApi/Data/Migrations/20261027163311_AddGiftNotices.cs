using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGiftNotices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gift_notices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    giver = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    transferred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    slip_path = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    verified = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gift_notices", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_gift_notices_transferred_at",
                table: "gift_notices",
                column: "transferred_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gift_notices");
        }
    }
}
